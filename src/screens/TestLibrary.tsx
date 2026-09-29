import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../state';
import { seedTestList } from '../lib/seed';
import { byDrawOrder, makeTube } from '../lib/estimate';
import { Tube } from '../components/Tube';
import { ScreenHeader } from '../components/ui';

export function TestLibrary() {
  const { data } = useApp();
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const tests = [...seedTestList]
    .sort((a, b) => a.name.localeCompare(b.name))
    .filter((t) => !q || t.code.includes(q) || t.name.toLowerCase().includes(q) || t.shortName?.toLowerCase().includes(q));
  const tubeTypes = Object.keys(data.key.codes)
    .map((code) => ({ ...makeTube(code, data.key, 0, []), type: data.key.codes[code] }))
    .sort(byDrawOrder);

  return (
    <div className="flex flex-1 flex-col">
      <ScreenHeader
        title="Test library"
        back={
          <Link to="/patients" className="-ml-2 inline-flex min-h-tap items-center px-2 text-label">
            ← Patients
          </Link>
        }
        subtitle="Which tube each test needs. Read only."
      />

      {!data.key.verified && (
        <p className="mx-4 mb-3 rounded-xl border-2 border-dashed border-ink px-4 py-3 text-label">
          Unverified. The test list and specimen key are placeholders until checked against the lab's own documents.
          Estimates built from them are provisional.
        </p>
      )}

      <div className="px-4">
        <label htmlFor="library-search" className="sr-only">
          Search tests
        </label>
        <input
          id="library-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or code"
          className="min-h-primary w-full rounded-xl border-2 border-ink bg-surface px-4 text-body"
        />
      </div>

      <ul className="mt-3 flex flex-col divide-y divide-rule border-y border-rule bg-surface">
        {tests.map((t) => {
          const tube = data.key.codes[t.specimen];
          return (
            <li key={t.code} className="flex min-h-primary items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="text-label">{t.name}</p>
                <p className="text-caption text-ink-2">
                  {t.code}
                  {t.dedicatedTube && ' · Needs its own tube'}
                </p>
                {t.handlingNote && <p className="text-caption">{t.handlingNote}</p>}
              </div>
              <span className="flex items-center gap-1.5 text-label">
                {tube && <Tube cap={tube.cap} state="empty" size="sm" label={tube.shortName ?? tube.tube} />}
                {tube?.shortName ?? t.specimen}
              </span>
            </li>
          );
        })}
        {tests.length === 0 && <li className="px-4 py-3 text-body text-ink-2">No tests match "{query}".</li>}
      </ul>

      <section className="px-4 pt-6 pb-6">
        <h2 className="font-display text-section">Specimen key</h2>
        <p className="mt-1 text-body text-ink-2">
          Rules the estimator uses when no confirmed list exists.
          {data.key.masterSerumTube && ' Any order with a serum test gets one extra SST (master serum).'}
        </p>
        <ul className="mt-3 flex flex-col gap-3">
          {tubeTypes.map((t) => (
            <li key={t.code} className="flex items-center gap-4 rounded-2xl border-2 border-rule bg-surface p-4">
              <Tube cap={t.cap} state="empty" size="md" label={t.shortName} />
              <div>
                <p className="text-tube">{t.name}</p>
                <p className="text-caption text-ink-2">
                  {t.type.additive} · lab code {t.code}
                </p>
                <p className="text-label">
                  Draw order {t.drawOrder} · up to {t.type.maxTestsPerTube} tests per tube
                </p>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
