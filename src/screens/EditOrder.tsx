import { Link, useNavigate, useParams } from 'react-router-dom';
import { useApp, useIsTablet } from '../state';
import { resolveTubes } from '../lib/resolveTubes';
import { normalizeCodes } from '../lib/signature';
import { seedPatients } from '../lib/seed';
import { ConfidencePill } from '../components/ConfidencePill';
import { TubeRow } from '../components/TubeRow';
import { TestSearch } from '../components/TestSearch';
import { BottomBar } from '../components/BottomBar';
import { Button, ScreenHeader, Warning } from '../components/ui';

export function EditOrder() {
  const { id = '' } = useParams();
  const { patient, data, setOrder, setVisit, state } = useApp();
  const navigate = useNavigate();
  const tablet = useIsTablet();

  const p = patient(id);
  if (!p) return null;

  const codes = p.orderedCodes;
  const r = resolveTubes(codes, data);
  const original = seedPatients.find((s) => s.id === p.id)?.orderedCodes ?? [];
  const edited = state.orders[p.id] !== undefined;

  const change = (next: string[]) => {
    setOrder(p.id, next);
    // Counts adjusted during the visit belonged to the old order.
    const progress = state.visits[p.id];
    if (progress && !progress.completed) setVisit(p.id, undefined);
  };
  const add = (code: string) => {
    if (!codes.includes(code)) change([...codes, code]);
  };
  const remove = (code: string) => change(codes.filter((c) => c !== code));

  return (
    <div className="flex flex-1 flex-col">
      <ScreenHeader
        title="Edit order"
        back={
          !tablet ? (
            <Link to={`/patients/${p.id}`} className="-ml-2 inline-flex min-h-tap items-center px-2 text-label">
              ← {p.name}
            </Link>
          ) : undefined
        }
        subtitle={`${p.name}. Changes apply right away.`}
      />

      {/* Live tube preview */}
      <section className="sticky top-0 z-10 mx-4 rounded-2xl border-2 border-ink bg-surface p-4" aria-live="polite">
        <div className="mb-2 flex items-center justify-between gap-3">
          <h2 className="text-label">Tubes for this order</h2>
          <ConfidencePill confidence={r.confidence} compact />
        </div>
        <TubeRow tubes={r.tubes} confidence={r.confidence} />
      </section>

      {r.warnings.length > 0 && (
        <div className="mx-4 mt-3 flex flex-col gap-2">
          {r.warnings.map((w) => (
            <Warning key={w.code}>{w.message}</Warning>
          ))}
        </div>
      )}

      <TestSearch exclude={codes} onAdd={add} tourId="test-search" />

      <section className="px-4 pt-5">
        <h2 className="font-display text-section">On this order</h2>
        {codes.length === 0 && <p className="mt-2 text-body text-ink-2">No tests yet. Search above to add one.</p>}
        <ul className="mt-2 flex flex-col gap-2">
          {normalizeCodes(codes).map((code) => {
            const t = data.tests[code];
            return (
              <li key={code} className="flex min-h-primary items-center gap-3 rounded-xl border-2 border-rule bg-surface pl-4">
                <span className="flex-1">
                  <span className={`block text-label ${t ? '' : 'text-blood'}`}>{t ? t.name : 'Unknown test'}</span>
                  <span className="block text-caption text-ink-2">
                    {code}
                    {t && ` · ${data.key.codes[t.specimen]?.shortName ?? t.specimen}`}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => remove(code)}
                  className="min-h-primary min-w-[60px] rounded-r-xl px-4 text-label underline underline-offset-4"
                  aria-label={`Remove ${t?.name ?? code}`}
                >
                  Remove
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <div className="h-6" />

      <BottomBar>
        {edited && (
          <Button big onClick={() => change(original)} disabled={normalizeCodes(original).join() === normalizeCodes(codes).join()}>
            Undo changes
          </Button>
        )}
        <Button variant="primary" big onClick={() => navigate(`/patients/${p.id}`)}>
          Done
        </Button>
      </BottomBar>
    </div>
  );
}
