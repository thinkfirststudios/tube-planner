import { useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useApp, useIsTablet } from '../state';
import { codesFromSignature } from '../lib/signature';
import { resolveTubes } from '../lib/resolveTubes';
import { todayIso } from '../lib/format';
import { byDrawOrder, makeTube } from '../lib/estimate';
import type { ConfirmedOrder, TubeCount } from '../lib/types';
import { Tube } from '../components/Tube';
import { BottomBar } from '../components/BottomBar';
import { Button, ScreenHeader, Stepper } from '../components/ui';

/** Confirm tubes for a patient's current order: /patients/:id/confirm */
export function ConfirmTubesForPatient() {
  const { id = '' } = useParams();
  const { patient, resolutions } = useApp();
  const p = patient(id);
  if (!p) return <Missing to="/" />;
  const r = resolutions[p.id];
  return (
    <ConfirmTubes
      signature={r.signature}
      initial={r.tubes.map((t) => ({ code: t.code, count: t.count }))}
      initialSource={r.confirmed?.source ?? 'lab'}
      initialNotes={r.confirmed?.notes ?? ''}
      backTo={`/patients/${p.id}`}
      backLabel={p.name}
      forName={p.name}
    />
  );
}

/** Edit a saved tube list: /orders/:sig */
export function ConfirmTubesForOrder() {
  const { sig = '' } = useParams();
  const { data } = useApp();
  // Opened from Look up tubes: go back there, not to Saved orders.
  const from = useLocation().state as { back?: string; label?: string } | null;
  const entry = data.confirmed[sig];
  const initial = entry ? entry.tubes : resolveTubes(codesFromSignature(sig), data).tubes;
  if (!sig) return <Missing to="/orders" />;
  return (
    <ConfirmTubes
      signature={sig}
      initial={initial.map((t) => ({ code: t.code, name: t.name, count: t.count }))}
      initialSource={entry?.source ?? 'lab'}
      initialNotes={entry?.notes ?? ''}
      backTo={from?.back ?? '/orders'}
      backLabel={from?.label ?? 'Saved orders'}
    />
  );
}

interface ConfirmTubesProps {
  signature: string;
  initial: TubeCount[];
  initialSource: ConfirmedOrder['source'];
  initialNotes: string;
  backTo: string;
  backLabel: string;
  forName?: string;
}

/**
 * Enter the lab's collection summary for this order. Saving writes a confirmed
 * entry for the signature, so every order with the same tests resolves instantly.
 */
export function ConfirmTubes({ signature, initial, initialSource, initialNotes, backTo, backLabel, forName }: ConfirmTubesProps) {
  const { data, saveConfirmed } = useApp();
  const navigate = useNavigate();
  const tablet = useIsTablet();

  const [counts, setCounts] = useState<Record<string, number>>(() =>
    Object.fromEntries(initial.map((t) => [t.code, t.count])),
  );
  const [source, setSource] = useState<ConfirmedOrder['source']>(initialSource);
  const [notes, setNotes] = useState(initialNotes);

  // Every tube type in the specimen key, plus any saved type the key doesn't know.
  const codes = new Set([...Object.keys(data.key.codes), ...initial.map((t) => t.code)]);
  const rows = [...codes]
    .map((code) => makeTube(code, data.key, counts[code] ?? 0, [], [], initial.find((t) => t.code === code)?.name))
    .sort(byDrawOrder);

  const total = rows.reduce((n, t) => n + t.count, 0);
  const testCodes = codesFromSignature(signature);
  const testNames = testCodes.map((c) => data.tests[c]?.shortName ?? data.tests[c]?.name ?? `Unknown ${c}`);

  const save = () => {
    const tubes = rows.filter((t) => t.count > 0).map((t) => ({ code: t.code, name: t.name, count: t.count }));
    saveConfirmed(signature, {
      tubes,
      source,
      recorded: todayIso(),
      ...(notes.trim() ? { notes: notes.trim() } : {}),
    });
    navigate(backTo, {
      replace: true,
      state: { flash: 'Tubes saved. Any order with these same tests will use this list from now on.' },
    });
  };

  return (
    <div className="flex flex-1 flex-col">
      <ScreenHeader
        title="Confirm tubes"
        back={
          !tablet || !forName ? (
            <Link to={backTo} className="-ml-2 inline-flex min-h-tap items-center px-2 text-label">
              ← {backLabel}
            </Link>
          ) : undefined
        }
        subtitle={
          <>
            Enter the tube counts from the lab's Specimen Collection Summary{forName ? ` for ${forName}` : ''}.
          </>
        }
      />

      <section className="mx-4 mb-4 rounded-2xl border-2 border-rule bg-surface p-4">
        <h2 className="text-label">For these tests</h2>
        <p className="text-body">{testNames.join(', ')}</p>
        <p className="mt-1 text-caption text-ink-2">Order key {signature}</p>
      </section>

      <ul className="flex flex-col gap-3 px-4">
        {rows.map((t) => (
          <li
            key={t.code}
            className={`flex items-center gap-3 rounded-2xl border-2 bg-surface p-3 ${t.count > 0 ? 'border-ink' : 'border-rule'}`}
          >
            <Tube cap={t.cap} state="empty" count={t.count} size="md" label={t.shortName} />
            <div className="min-w-0 flex-1">
              <h3 className={`text-tube ${t.count > 0 ? '' : 'text-ink-2'}`}>{t.shortName}</h3>
              <p className="text-caption text-ink-2">{t.name}</p>
            </div>
            <Stepper big value={t.count} onChange={(n) => setCounts((c) => ({ ...c, [t.code]: n }))} label={t.shortName} />
          </li>
        ))}
      </ul>

      <fieldset className="mx-4 mt-5">
        <legend className="text-label">Where these counts came from</legend>
        <div className="mt-2 grid grid-cols-2 gap-3">
          {(
            [
              ['lab', "Lab's collection page"],
              ['nurse', 'My own count'],
            ] as const
          ).map(([value, label]) => (
            <label
              key={value}
              className={`flex min-h-primary cursor-pointer items-center justify-center rounded-xl border-2 px-3 text-center text-label ${
                source === value ? 'border-ink bg-ink text-surface' : 'border-rule bg-surface'
              }`}
            >
              <input
                type="radio"
                name="source"
                value={value}
                checked={source === value}
                onChange={() => setSource(value)}
                className="sr-only"
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      <label className="mx-4 mt-5 block text-label" htmlFor="confirm-notes">
        Notes (optional)
      </label>
      <input
        id="confirm-notes"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="e.g. Includes SS/1 Master Serum tube"
        className="mx-4 mt-1 min-h-tap rounded-xl border-2 border-rule bg-surface px-3 text-body"
      />

      <div className="h-6" />

      <BottomBar>
        <Button big onClick={() => navigate(backTo)}>
          Cancel
        </Button>
        <Button variant="primary" big onClick={save} disabled={total === 0 || !signature}>
          Save {total} {total === 1 ? 'tube' : 'tubes'}
        </Button>
      </BottomBar>
    </div>
  );
}

function Missing({ to }: { to: string }) {
  return (
    <div className="p-4">
      <h1 className="font-display text-display">Nothing to confirm</h1>
      <Link to={to} className="mt-4 inline-flex min-h-tap items-center text-label underline">
        Go back
      </Link>
    </div>
  );
}
