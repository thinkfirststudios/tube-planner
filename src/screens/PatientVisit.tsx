import { useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useApp, useIsTablet } from '../state';
import { diffTubes, lastDraw } from '../lib/draw';
import { ageOn, explainResolution, formatDate, formatTime, plural, todayIso } from '../lib/format';
import { demoDate } from '../lib/seed';
import type { DrawRecord, TubeCount } from '../lib/types';
import type { VisitProgress } from '../lib/storage';
import { ConfidencePill } from '../components/ConfidencePill';
import { TubeCard } from '../components/TubeCard';
import { Tube } from '../components/Tube';
import { BottomBar } from '../components/BottomBar';
import { Button, Sheet, Warning } from '../components/ui';

export function PatientVisit() {
  const { id = '' } = useParams();
  const { patient, resolutions, data, state, setVisit, addDraw, saveConfirmed } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const tablet = useIsTablet();
  const [completing, setCompleting] = useState(false);

  const p = patient(id);
  if (!p) return <NotFound />;

  const r = resolutions[p.id];
  const flash = (location.state as { flash?: string } | null)?.flash;
  const today = todayIso();
  const stored = state.visits[p.id];
  const progress: VisitProgress = stored?.date === today ? stored : { date: today, drawn: [], actual: {} };
  const completed = !!progress.completed;

  // The draw saved when completing today's visit shouldn't count as "last visit".
  const previous = lastDraw(p.drawHistory.filter((d) => !(completed && d.date === today)));
  const diffs = previous ? diffTubes(r.tubes, previous.tubes) : [];
  const lastByCode = new Map(diffs.map((d) => [d.code, d.last]));

  const actualOf = (code: string, planned: number) => progress.actual[code] ?? planned;
  const actualTubes: TubeCount[] = r.tubes.map((t) => ({ code: t.code, name: t.name, count: actualOf(t.code, t.count) }));
  const drawnCount = r.tubes.filter((t) => progress.drawn.includes(t.code)).length;

  const update = (next: Partial<VisitProgress>) => setVisit(p.id, { ...progress, ...next });
  const toggleDrawn = (code: string) =>
    update({ drawn: progress.drawn.includes(code) ? progress.drawn.filter((c) => c !== code) : [...progress.drawn, code] });
  const setActual = (code: string, planned: number, n: number) => {
    const actual = { ...progress.actual };
    if (n === planned) delete actual[code];
    else actual[code] = n;
    update({ actual });
  };

  const complete = (note: string, saveAsNurse: boolean) => {
    const record: DrawRecord = {
      date: today,
      orderedCodes: p.orderedCodes,
      tubes: actualTubes.filter((t) => t.count > 0).map(({ code, count }) => ({ code, count })),
      ...(note.trim() ? { note: note.trim() } : {}),
    };
    addDraw(p.id, record);
    if (saveAsNurse && r.signature) {
      saveConfirmed(r.signature, { tubes: record.tubes, source: 'nurse', recorded: today });
    }
    setVisit(p.id, { ...progress, completed: true });
    setCompleting(false);
    if (!tablet) navigate('/');
  };

  const steps = r.tubes.length;

  return (
    <div className="flex flex-1 flex-col">
      <header className="px-4 pt-3 pb-2">
        {!tablet && (
          <Link to="/" className="-ml-2 inline-flex min-h-tap items-center px-2 text-label">
            ← Today
          </Link>
        )}
        <p className="text-label text-ink-2">{formatTime(p.visitTime)}</p>
        <h1 className="font-display text-display">{p.name}</h1>
        <p className="text-body text-ink-2">
          {ageOn(p.dob, demoDate)} yrs · DOB {formatDate(p.dob)}
        </p>
        <p className="text-body text-ink-2">{p.address}</p>
      </header>

      {flash && (
        <p role="status" className="mx-4 mb-2 rounded-xl bg-ink px-4 py-3 text-label text-surface">
          {flash}
        </p>
      )}

      {completed && (
        <p role="status" className="mx-4 mb-2 rounded-xl border-2 border-ink bg-surface px-4 py-3 text-label">
          Visit completed. The draw is saved to this patient's history.
        </p>
      )}

      <section className="px-4 py-3" aria-labelledby="tests-heading">
        <div className="flex items-center justify-between gap-3">
          <h2 id="tests-heading" className="font-display text-section">
            Tests ordered
          </h2>
          <Link to={`/patients/${p.id}/order`} className="inline-flex min-h-tap items-center rounded-xl px-3 text-label underline underline-offset-4">
            Edit order
          </Link>
        </div>
        <ul className="mt-2 flex flex-wrap gap-2">
          {p.orderedCodes.map((code) => {
            const t = data.tests[code];
            return (
              <li
                key={code}
                className={`rounded-lg border-2 px-3 py-1.5 text-label ${t ? 'border-rule bg-surface' : 'border-blood text-blood'}`}
              >
                {t ? t.shortName ?? t.name : 'Unknown test'} <span className="text-caption text-ink-2">{code}</span>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="px-4 py-3" aria-labelledby="tubes-heading">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="tubes-heading" className="font-display text-section">
            Tubes to draw
          </h2>
          <ConfidencePill confidence={r.confidence} />
        </div>
        <p className="mt-2 text-body text-ink-2">{explainResolution(r, p.orderedCodes, data.tests, previous)}</p>
        {r.confirmed?.notes && <p className="mt-1 text-label">Note: {r.confirmed.notes}</p>}

        {r.warnings.length > 0 && (
          <div className="mt-3 flex flex-col gap-2">
            {r.warnings.map((w) => (
              <Warning key={w.code}>{w.message}</Warning>
            ))}
          </div>
        )}

        {previous && <LastVisit record={previous} diffs={diffs.length} tubes={data.key.codes} />}

        {steps > 0 && (
          <p className="mt-4 text-label">
            {steps === 1 ? 'One tube type to draw.' : `Draw in order, step 1 to ${steps}.`}{' '}
            <span className="text-ink-2">
              {drawnCount} of {steps} done
            </span>
          </p>
        )}
        <ol className="mt-3 flex flex-col gap-3">
          {r.tubes.map((t, i) => (
            <TubeCard
              key={t.code}
              step={i + 1}
              tube={t}
              confidence={r.confidence}
              tests={data.tests}
              drawn={progress.drawn.includes(t.code)}
              onToggleDrawn={() => toggleDrawn(t.code)}
              actual={actualOf(t.code, t.count)}
              onActualChange={(n) => setActual(t.code, t.count, n)}
              lastCount={lastByCode.get(t.code)}
              disabled={completed}
            />
          ))}
        </ol>
        {diffs
          .filter((d) => d.now === 0)
          .map((d) => (
            <p key={d.code} className="mt-3 text-label">
              Last visit also drew {plural(d.last, data.key.codes[d.code]?.shortName ?? d.code)}, which isn't on today's list.
            </p>
          ))}
      </section>

      <div className="h-4" />

      <BottomBar>
        {r.confidence === 'estimated' ? (
          <>
            <Button variant="primary" big onClick={() => navigate(`/patients/${p.id}/confirm`)} disabled={!r.signature}>
              Confirm tubes
            </Button>
            <Button big onClick={() => setCompleting(true)} disabled={completed || steps === 0}>
              {completed ? 'Completed' : 'Complete visit'}
            </Button>
          </>
        ) : (
          <>
            <Button big onClick={() => navigate(`/patients/${p.id}/confirm`)}>
              Confirm tubes
            </Button>
            <Button variant="primary" big onClick={() => setCompleting(true)} disabled={completed || steps === 0}>
              {completed ? 'Completed' : 'Complete visit'}
            </Button>
          </>
        )}
      </BottomBar>

      <CompleteSheet
        open={completing}
        onClose={() => setCompleting(false)}
        onSave={complete}
        tubes={actualTubes}
        planned={r.tubes.map((t) => ({ code: t.code, count: t.count }))}
        notDrawn={steps - drawnCount}
        estimated={r.confidence === 'estimated'}
        shortName={(code) => data.key.codes[code]?.shortName ?? code}
      />
    </div>
  );
}

function LastVisit({
  record,
  diffs,
  tubes,
}: {
  record: DrawRecord;
  diffs: number;
  tubes: ReturnType<typeof useApp>['data']['key']['codes'];
}) {
  return (
    <aside
      className={`mt-4 rounded-2xl border-2 bg-surface p-4 ${diffs > 0 ? 'border-dashed border-ink' : 'border-rule'}`}
      aria-label="Last visit"
    >
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-label">Last visit · {formatDate(record.date)}</h3>
        <span className="text-caption">{diffs > 0 ? `${plural(diffs, 'difference')} from today` : 'Same tubes as today'}</span>
      </div>
      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
        {record.tubes.map((t) => {
          const type = tubes[t.code];
          return (
            <li key={t.code} className="flex items-center gap-1.5">
              <Tube cap={type?.cap ?? 'gray'} state="filled" size="sm" label={type?.shortName ?? t.code} />
              <span className="text-label">
                {t.count} {type?.shortName ?? t.code}
              </span>
            </li>
          );
        })}
      </ul>
      {record.note && <p className="mt-2 text-body">“{record.note}”</p>}
    </aside>
  );
}

function CompleteSheet({
  open,
  onClose,
  onSave,
  tubes,
  planned,
  notDrawn,
  estimated,
  shortName,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (note: string, saveAsNurse: boolean) => void;
  tubes: TubeCount[];
  planned: TubeCount[];
  notDrawn: number;
  estimated: boolean;
  shortName: (code: string) => string;
}) {
  const [note, setNote] = useState('');
  const [saveAsNurse, setSaveAsNurse] = useState(false);
  const changed = tubes.some((t) => planned.find((x) => x.code === t.code)?.count !== t.count);

  return (
    <Sheet open={open} onClose={onClose} title="Complete visit">
      <p className="text-label">Tubes drawn</p>
      <p className="text-body">
        {tubes
          .filter((t) => t.count > 0)
          .map((t) => `${t.count} ${shortName(t.code)}`)
          .join(', ') || 'None'}
        {changed && <span className="text-ink-2"> (changed from the plan)</span>}
      </p>
      {notDrawn > 0 && (
        <p className="mt-2 text-label text-blood">
          {plural(notDrawn, 'tube type')} not checked off yet. They'll be saved with the counts above.
        </p>
      )}

      <label className="mt-4 block text-label" htmlFor="visit-note">
        Note for next time (optional)
      </label>
      <textarea
        id="visit-note"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={3}
        placeholder="Veins, arm used, anything the next visit should know"
        className="mt-1 w-full rounded-xl border-2 border-rule bg-surface p-3 text-body"
      />

      {estimated && (
        <label className="mt-3 flex min-h-tap cursor-pointer items-start gap-3 rounded-xl border-2 border-rule p-3">
          <input
            type="checkbox"
            checked={saveAsNurse}
            onChange={(e) => setSaveAsNurse(e.target.checked)}
            className="mt-0.5 h-6 w-6 shrink-0 accent-[var(--color-ink)]"
          />
          <span>
            <span className="block text-label">Save these counts as nurse confirmed</span>
            <span className="block text-caption text-ink-2">
              Every future order with these exact tests will use them instead of an estimate.
            </span>
          </span>
        </label>
      )}

      <div className="mt-4 mb-2 flex gap-3 [&>*]:flex-1">
        <Button big onClick={onClose}>
          Cancel
        </Button>
        <Button variant="primary" big onClick={() => onSave(note, saveAsNurse)}>
          Save visit
        </Button>
      </div>
    </Sheet>
  );
}

function NotFound() {
  return (
    <div className="p-4">
      <h1 className="font-display text-display">Visit not found</h1>
      <Link to="/" className="mt-4 inline-flex min-h-tap items-center text-label underline">
        Back to today
      </Link>
    </div>
  );
}
