import type { AppState } from './storage';

/**
 * The guided tour: a fixed list of steps over fresh demo data. Info steps wait
 * for "Next". Task steps wait for the person to do the thing, detected from the
 * route and app state, so the tour learns where people get stuck.
 */

export interface TourContext {
  pathname: string;
  state: AppState;
}

export interface TourStep {
  id: string;
  kind: 'info' | 'task';
  title: string;
  body: string;
  /** data-tour values to highlight; the first one on screen wins */
  targets?: string[];
  /** Route the step happens on. The tour goes there when the step starts. */
  startPath?: string;
  /** Task steps: true once the person has done it */
  done?: (ctx: TourContext) => boolean;
}

/** Frank Delgado: CBC + CMP, which has a lab-confirmed tube list in the seed data. */
export const TOUR_PATIENT = 'P008';

export const TOUR_STEPS: TourStep[] = [
  {
    id: 'today',
    kind: 'info',
    title: "Today's visits",
    body: 'This is the schedule for the day. Each visit shows the tubes to draw, as small tubes with their cap colors.',
    startPath: '/',
  },
  {
    id: 'open-visit',
    kind: 'task',
    title: 'Open a visit',
    body: "Tap Frank Delgado's visit.",
    targets: [`visit-${TOUR_PATIENT}`],
    done: (c) => c.pathname === `/patients/${TOUR_PATIENT}`,
  },
  {
    id: 'read-visit',
    kind: 'info',
    title: 'Tubes in order of draw',
    body: '"Lab confirmed" means these counts came from the lab\'s own paperwork, so you can trust them.',
    startPath: `/patients/${TOUR_PATIENT}`,
  },
  {
    id: 'mark-drawn',
    kind: 'task',
    title: 'Check off a tube',
    body: 'Tap Draw on the first tube, as if you had just filled it.',
    targets: ['draw-first'],
    startPath: `/patients/${TOUR_PATIENT}`,
    done: (c) => (c.state.visits[TOUR_PATIENT]?.drawn.length ?? 0) > 0,
  },
  {
    id: 'edit-order',
    kind: 'task',
    title: 'Change the order',
    body: 'Tap Edit order, then add Magnesium and Phosphorus. Watch the tubes at the top change.',
    targets: ['test-search', 'edit-order'],
    startPath: `/patients/${TOUR_PATIENT}`,
    done: (c) => {
      const codes = c.state.orders[TOUR_PATIENT] ?? [];
      return codes.includes('622') && codes.includes('718');
    },
  },
  {
    id: 'pack-list',
    kind: 'task',
    title: 'Pack for the day',
    body: 'Open the Pack list from the menu at the bottom.',
    targets: ['nav-pack'],
    done: (c) => c.pathname === '/pack',
  },
  {
    id: 'read-pack',
    kind: 'info',
    title: 'Everything to bring',
    body: 'This adds up every tube for the day, plus spares. Use the + and − buttons to change the spares.',
    startPath: '/pack',
  },
];

export interface StepLog {
  id: string;
  outcome: 'done' | 'skipped';
  ms: number;
}

export interface Survey {
  /** 1 (hard) to 5 (easy) */
  ease?: number;
  confusing?: string;
  wouldUse?: 'Yes' | 'Maybe' | 'No';
  nameRole?: string;
}

export interface TourSession {
  id: string;
  startedAt: number;
  /** Person agreed to share results */
  consent: boolean;
  stepIndex: number;
  stepStartedAt: number;
  log: StepLog[];
  /** After the last step, or after "End tour" */
  phase: 'steps' | 'survey';
  /** Set when the person ended the tour early */
  quitAt?: string;
  /** The person's own app state, put back when the tour ends */
  snapshot: AppState;
}

/** One row in the results sheet. Flat, so each key is a column. */
export type TourResult = Record<string, string | number>;

export function newSession(snapshot: AppState, consent: boolean, now: number, id = randomId()): TourSession {
  return { id, startedAt: now, consent, stepIndex: 0, stepStartedAt: now, log: [], phase: 'steps', snapshot };
}

/** Record the current step and move on. Past the last step, the survey starts. */
export function advance(s: TourSession, outcome: StepLog['outcome'], now: number): TourSession {
  const step = TOUR_STEPS[s.stepIndex];
  if (!step || s.phase !== 'steps') return s;
  const log = [...s.log, { id: step.id, outcome, ms: now - s.stepStartedAt }];
  const next = s.stepIndex + 1;
  return next < TOUR_STEPS.length
    ? { ...s, log, stepIndex: next, stepStartedAt: now }
    : { ...s, log, stepIndex: next, stepStartedAt: now, phase: 'survey' };
}

/** End early: the survey still shows, and the row records where they stopped. */
export function quit(s: TourSession, now: number): TourSession {
  if (s.phase !== 'steps') return s;
  const step = TOUR_STEPS[s.stepIndex];
  return { ...s, phase: 'survey', quitAt: step?.id, stepStartedAt: now };
}

export function summarize(s: TourSession, survey: Survey, now: number, extra: { device: string; appVersion: string }): TourResult {
  const row: TourResult = {
    session: s.id,
    started: new Date(s.startedAt).toISOString(),
    finished: s.quitAt ? 'No' : 'Yes',
    'stopped at': s.quitAt ?? '',
    'steps done': s.log.filter((l) => l.outcome === 'done').length,
    'steps skipped': s.log.filter((l) => l.outcome === 'skipped').length,
    'total seconds': Math.round((now - s.startedAt) / 1000),
  };
  for (const step of TOUR_STEPS) {
    const l = s.log.find((x) => x.id === step.id);
    row[`step: ${step.id}`] = l ? `${l.outcome} ${Math.round(l.ms / 1000)}s` : '';
  }
  row['ease (1-5)'] = survey.ease ?? '';
  row.confusing = clip(survey.confusing);
  row['would use'] = survey.wouldUse ?? '';
  row['name or role'] = clip(survey.nameRole);
  row.device = extra.device;
  row['app version'] = extra.appVersion;
  return row;
}

function clip(text: string | undefined, max = 1000): string {
  return (text ?? '').trim().slice(0, max);
}

function randomId(): string {
  return globalThis.crypto?.randomUUID?.().slice(0, 8) ?? Math.random().toString(36).slice(2, 10);
}
