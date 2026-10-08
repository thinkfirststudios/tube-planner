import { Link, useSearchParams } from 'react-router-dom';
import { useApp } from '../state';
import { resolveTubes, totalTubes } from '../lib/resolveTubes';
import { explainResolution, plural } from '../lib/format';
import { ConfidencePill } from '../components/ConfidencePill';
import { TestSearch } from '../components/TestSearch';
import { Tube } from '../components/Tube';
import { ScreenHeader, Warning } from '../components/ui';

/**
 * Type the tests on an order, get the tubes: /lookup?tests=6399,10231
 * The tests live in the URL, so going back to this screen keeps them.
 */
export function LookUp() {
  const { data } = useApp();
  const [params, setParams] = useSearchParams();
  // Kept in the order typed, so the list reads like the order sheet.
  const codes = [...new Set((params.get('tests') ?? '').split(',').map((c) => c.trim()).filter(Boolean))];
  const setCodes = (next: string[]) => setParams(next.length ? { tests: next.join(',') } : {}, { replace: true });

  const r = resolveTubes(codes, data);
  const total = totalTubes(r);
  const here = `/lookup?tests=${codes.join(',')}`;

  return (
    <div className="flex flex-1 flex-col pb-6">
      <ScreenHeader title="Look up tubes" subtitle="Type the tests on an order to see which tubes to draw, in order." />

      <TestSearch exclude={codes} onAdd={(code) => setCodes([...codes, code])} tourId="lookup-search" />

      {codes.length > 0 && (
        <section className="px-4 pt-4" aria-label="Tests">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-label">{plural(codes.length, 'test')}</h2>
            <button type="button" onClick={() => setCodes([])} className="min-h-tap px-2 text-caption underline underline-offset-4">
              Clear all
            </button>
          </div>
          <ul className="mt-1 flex flex-wrap gap-2">
            {codes.map((code) => {
              const t = data.tests[code];
              const name = t ? t.shortName ?? t.name : `Unknown ${code}`;
              return (
                <li key={code}>
                  <button
                    type="button"
                    onClick={() => setCodes(codes.filter((c) => c !== code))}
                    aria-label={`Remove ${name}`}
                    className={`inline-flex min-h-tap items-center gap-2 rounded-lg border-2 bg-surface pr-2 pl-3 text-label ${
                      t ? 'border-rule' : 'border-blood text-blood'
                    }`}
                  >
                    {name}
                    <span aria-hidden="true" className="text-[20px] leading-none text-ink-2">
                      ×
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {codes.length === 0 ? (
        <p className="px-4 pt-4 text-body text-ink-2">
          Add each test on the order. Abbreviations work too, like CBCD, ESR or CPK.
        </p>
      ) : (
        <section className="px-4 pt-5" aria-labelledby="lookup-tubes" aria-live="polite">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="lookup-tubes" className="font-display text-section">
              {total > 0 ? `Draw ${plural(total, 'tube')}` : 'No tubes yet'}
            </h2>
            {total > 0 && <ConfidencePill confidence={r.confidence} />}
          </div>
          <p className="mt-2 text-body text-ink-2">{explainResolution(r, codes, data.tests)}</p>
          {r.confirmed?.notes && <p className="mt-1 text-label">Note: {r.confirmed.notes}</p>}

          {r.warnings.length > 0 && (
            <div className="mt-3 flex flex-col gap-2">
              {r.warnings.map((w) => (
                <Warning key={w.code}>{w.message}</Warning>
              ))}
            </div>
          )}

          <ol className="mt-3 flex flex-col gap-3">
            {r.tubes.map((t, i) => {
              const tests = t.tests.map((c) => data.tests[c]?.shortName ?? data.tests[c]?.name ?? c);
              return (
                <li key={t.code} className="flex items-center gap-4 rounded-2xl border-2 border-ink bg-surface p-4">
                  <span className="text-caption text-ink-2" aria-label={`Step ${i + 1}`}>
                    {i + 1}
                  </span>
                  <Tube cap={t.cap} state={r.confidence === 'estimated' ? 'estimated' : 'empty'} count={t.count} size="md" label={t.shortName} />
                  <div className="min-w-0 flex-1">
                    <p className="text-tube">
                      {t.count} {t.shortName}
                    </p>
                    <p className="text-caption text-ink-2">{t.name}</p>
                    {tests.length > 0 && <p className="mt-1 text-body">{tests.join(', ')}</p>}
                    {t.notes.length > 0 && <p className="text-caption text-ink-2">{t.notes.join(' · ')}</p>}
                  </div>
                </li>
              );
            })}
          </ol>

          {total > 0 && (
            <div className="mt-4">
              <Link
                to={`/orders/${r.signature}`}
                state={{ back: here, label: 'Look up tubes' }}
                className="flex min-h-tap w-full items-center justify-center rounded-xl border-2 border-ink bg-surface px-5 text-label active:bg-ground"
              >
                {r.confirmed ? 'Change the saved count' : "Enter the lab's count"}
              </Link>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
