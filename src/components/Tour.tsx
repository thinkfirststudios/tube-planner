import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../state';
import { emptyState, type KeyValueStore } from '../lib/storage';
import { TOUR_STEPS, advance, newSession, quit, summarize, type Survey, type TourSession } from '../lib/tour';
import { enqueue, flush } from '../lib/feedback';
import { Button, Sheet } from './ui';

const SESSION_KEY = 'tube-planner:tour';
/** Google Apps Script web app URL. Unset means results are never collected. */
const FEEDBACK_URL = (import.meta.env.VITE_FEEDBACK_URL as string | undefined) || undefined;
const APP_VERSION = ((import.meta.env.VITE_APP_VERSION as string | undefined) ?? 'dev').slice(0, 7);

function store(): KeyValueStore | undefined {
  try {
    return globalThis.localStorage;
  } catch {
    return undefined;
  }
}

function loadSession(): TourSession | null {
  try {
    const raw = store()?.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as TourSession) : null;
  } catch {
    return null;
  }
}

interface TourContextValue {
  session: TourSession | null;
  openStart(): void;
  next(): void;
  skip(): void;
  end(): void;
}

const TourContext = createContext<TourContextValue | null>(null);

export function useTour(): TourContextValue {
  const ctx = useContext(TourContext);
  if (!ctx) throw new Error('useTour must be used inside TourProvider');
  return ctx;
}

/**
 * Runs the guided tour on fresh demo data, then puts the person's own data back.
 * The session is saved on every change, so a reload mid-tour picks up where it was.
 */
export function TourProvider({ children }: { children: ReactNode }) {
  const { state, replaceState } = useApp();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [session, setSession] = useState<TourSession | null>(loadSession);
  const [starting, setStarting] = useState(false);
  const [thanks, setThanks] = useState<'sent' | 'done' | null>(null);
  const flushing = useRef(false);

  useEffect(() => {
    try {
      if (session) store()?.setItem(SESSION_KEY, JSON.stringify(session));
      else store()?.removeItem(SESSION_KEY);
    } catch {
      // Can't persist: the tour still works until a reload.
    }
  }, [session]);

  const sendQueued = useCallback(async () => {
    if (flushing.current) return;
    flushing.current = true;
    try {
      await flush(FEEDBACK_URL, store());
    } finally {
      flushing.current = false;
    }
  }, []);

  // Results queued while offline go out on the next launch or reconnect.
  useEffect(() => {
    void sendQueued();
    window.addEventListener('online', sendQueued);
    return () => window.removeEventListener('online', sendQueued);
  }, [sendQueued]);

  const step = session?.phase === 'steps' ? TOUR_STEPS[session.stepIndex] : undefined;

  // Each step starts on its own screen, so a skipped task never strands the next one.
  useEffect(() => {
    if (step?.startPath && pathname !== step.startPath) navigate(step.startPath);
    // Only when the step changes, not on every navigation within it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step?.id]);

  // Task steps finish themselves once the person has done the thing.
  useEffect(() => {
    if (step?.kind === 'task' && step.done?.({ pathname, state })) {
      setSession((s) => (s ? advance(s, 'done', Date.now()) : s));
    }
  }, [step, pathname, state]);

  useHighlight(step?.targets);

  const start = (consent: boolean) => {
    setStarting(false);
    setSession(newSession(state, consent, Date.now()));
    replaceState(emptyState());
    navigate('/');
  };

  const finish = (survey: Survey | null) => {
    if (!session) return;
    if (session.consent && FEEDBACK_URL) {
      enqueue(store(), summarize(session, survey ?? {}, Date.now(), { device: deviceType(), appVersion: APP_VERSION }));
      void sendQueued();
    }
    replaceState(session.snapshot);
    setSession(null);
    navigate('/');
    setThanks(session.consent && FEEDBACK_URL && survey ? 'sent' : 'done');
  };

  const value: TourContextValue = {
    session,
    openStart: () => setStarting(true),
    next: () => setSession((s) => (s ? advance(s, 'done', Date.now()) : s)),
    skip: () => setSession((s) => (s ? advance(s, 'skipped', Date.now()) : s)),
    end: () => setSession((s) => (s ? quit(s, Date.now()) : s)),
  };

  return (
    <TourContext.Provider value={value}>
      {children}
      <StartSheet open={starting} onClose={() => setStarting(false)} onStart={start} />
      <SurveySheet
        open={session?.phase === 'survey'}
        quitEarly={Boolean(session?.quitAt)}
        ask={Boolean(session?.consent && FEEDBACK_URL)}
        onDone={finish}
      />
      <Sheet open={thanks !== null} onClose={() => setThanks(null)} title={thanks === 'sent' ? 'Thank you!' : 'Tour finished'}>
        <p className="text-body">
          {thanks === 'sent' && 'Your answers help make this app better. '}
          Everything is back the way you left it.
        </p>
        <div className="mt-4 mb-2 flex [&>*]:flex-1">
          <Button variant="primary" big onClick={() => setThanks(null)}>
            Close
          </Button>
        </div>
      </Sheet>
    </TourContext.Provider>
  );
}

function deviceType() {
  return window.matchMedia('(min-width: 768px)').matches ? 'tablet' : 'phone';
}

/** Outline the first target found on screen. Polls, since screens render after navigation. */
function useHighlight(targets: string[] | undefined) {
  const key = targets?.join('|') ?? '';
  useEffect(() => {
    if (!key) return;
    let current: Element | null = null;
    const tick = () => {
      const el = key
        .split('|')
        .map((t) => document.querySelector(`[data-tour="${t}"]`))
        .find(Boolean) ?? null;
      if (el === current) return;
      current?.removeAttribute('data-tour-active');
      current = el;
      if (el) {
        el.setAttribute('data-tour-active', '');
        el.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }
    };
    tick();
    const timer = window.setInterval(tick, 400);
    return () => {
      window.clearInterval(timer);
      current?.removeAttribute('data-tour-active');
    };
  }, [key]);
}

/** "Take the tour" entry point. Hidden while a tour is running. */
export function TourButton() {
  const { session, openStart } = useTour();
  if (session) return null;
  return (
    <Button variant="secondary" onClick={openStart}>
      Take the tour
    </Button>
  );
}

/** The coach panel between the screen and the bottom menu. */
export function TourPanel() {
  const { session, next, skip, end } = useTour();
  if (!session || session.phase !== 'steps') return null;
  const step = TOUR_STEPS[session.stepIndex];
  if (!step) return null;
  const last = session.stepIndex === TOUR_STEPS.length - 1;

  return (
    <section aria-label="Tour" aria-live="polite" className="border-t-2 border-ink bg-surface px-4 pb-3">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between gap-3">
          <p className="text-caption text-ink-2">
            Tour · step {session.stepIndex + 1} of {TOUR_STEPS.length}
          </p>
          <div className="flex">
            {step.kind === 'task' && (
              <button type="button" onClick={skip} className="min-h-tap px-2 text-caption underline underline-offset-4">
                Skip step
              </button>
            )}
            <button type="button" onClick={end} className="min-h-tap px-2 text-caption underline underline-offset-4">
              End tour
            </button>
          </div>
        </div>
        <div className="flex items-end gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-label">{step.title}</p>
            <p className="text-body">{step.body}</p>
          </div>
          {step.kind === 'info' && (
            <Button variant="primary" onClick={next}>
              {last ? 'Finish' : 'Next'}
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}

function StartSheet({ open, onClose, onStart }: { open: boolean; onClose: () => void; onStart: (consent: boolean) => void }) {
  return (
    <Sheet open={open} onClose={onClose} title="Take the tour">
      <p className="text-body">
        A few short tasks show how the app works. It takes about 3 minutes. The tour uses fresh demo data, and anything
        you've changed comes back when it ends.
      </p>
      {FEEDBACK_URL ? (
        <>
          <p className="mt-3 text-label">Help improve this app?</p>
          <p className="text-body text-ink-2">
            We'd like to see how the tour goes: which steps you finish, how long they take, and your answers to a few
            questions at the end. It's anonymous unless you choose to add your name.
          </p>
          <div className="mt-4 mb-2 flex flex-col gap-3">
            <Button variant="primary" big onClick={() => onStart(true)}>
              Yes, share how it goes
            </Button>
            <Button big onClick={() => onStart(false)}>
              No thanks, just the tour
            </Button>
          </div>
        </>
      ) : (
        <div className="mt-4 mb-2 flex [&>*]:flex-1">
          <Button variant="primary" big onClick={() => onStart(false)}>
            Start the tour
          </Button>
        </div>
      )}
    </Sheet>
  );
}

function SurveySheet({
  open,
  quitEarly,
  ask,
  onDone,
}: {
  open: boolean;
  quitEarly: boolean;
  ask: boolean;
  onDone: (survey: Survey | null) => void;
}) {
  const [survey, setSurvey] = useState<Survey>({});
  const set = (patch: Survey) => setSurvey((s) => ({ ...s, ...patch }));
  const done = (answers: Survey | null) => {
    onDone(answers);
    setSurvey({});
  };

  if (!ask) {
    return (
      <Sheet open={open} onClose={() => done(null)} title={quitEarly ? 'Tour ended' : 'You finished the tour'}>
        <p className="text-body">Your own data comes back when you close this.</p>
        <div className="mt-4 mb-2 flex [&>*]:flex-1">
          <Button variant="primary" big onClick={() => done(null)}>
            Close
          </Button>
        </div>
      </Sheet>
    );
  }

  const choice = (selected: boolean) =>
    `min-h-tap flex-1 rounded-xl border-2 border-ink text-label ${selected ? 'bg-ink text-surface' : 'bg-surface'}`;

  return (
    <Sheet open={open} onClose={() => done(null)} title={quitEarly ? 'Before you go' : 'You finished the tour'}>
      <div className="flex flex-col gap-4 pb-2">
        <p className="text-body text-ink-2">A few quick questions. All optional.</p>

        <fieldset>
          <legend className="text-label">How easy was the app to use?</legend>
          <div className="mt-1 flex gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" aria-pressed={survey.ease === n} onClick={() => set({ ease: n })} className={choice(survey.ease === n)}>
                {n}
              </button>
            ))}
          </div>
          <p className="mt-1 flex justify-between text-caption text-ink-2">
            <span>Hard</span>
            <span>Easy</span>
          </p>
        </fieldset>

        <label className="block">
          <span className="text-label">Was anything confusing?</span>
          <textarea
            value={survey.confusing ?? ''}
            onChange={(e) => set({ confusing: e.target.value })}
            rows={3}
            maxLength={1000}
            className="mt-1 w-full rounded-xl border-2 border-ink bg-surface p-3 text-body"
          />
        </label>

        <fieldset>
          <legend className="text-label">Would you use this at work?</legend>
          <div className="mt-1 flex gap-2">
            {(['Yes', 'Maybe', 'No'] as const).map((v) => (
              <button key={v} type="button" aria-pressed={survey.wouldUse === v} onClick={() => set({ wouldUse: v })} className={choice(survey.wouldUse === v)}>
                {v}
              </button>
            ))}
          </div>
        </fieldset>

        <label className="block">
          <span className="text-label">Your name or role (optional)</span>
          <span className="block text-caption text-ink-2">For example "home health nurse". Leave blank to stay anonymous.</span>
          <input
            value={survey.nameRole ?? ''}
            onChange={(e) => set({ nameRole: e.target.value })}
            maxLength={200}
            autoComplete="off"
            className="mt-1 min-h-primary w-full rounded-xl border-2 border-ink bg-surface px-4 text-body"
          />
        </label>

        <div className="flex gap-3 [&>*]:flex-1">
          <Button big onClick={() => done(null)}>
            Skip
          </Button>
          <Button variant="primary" big onClick={() => done(survey)}>
            Send
          </Button>
        </div>
      </div>
    </Sheet>
  );
}
