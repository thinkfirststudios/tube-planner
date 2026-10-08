import { useState } from 'react';
import { useApp } from '../state';
import { seedTestList } from '../lib/seed';
import { searchTests } from '../lib/search';
import { Tube } from './Tube';

interface TestSearchProps {
  /** Codes already chosen; they don't show in the results */
  exclude: readonly string[];
  onAdd: (code: string) => void;
  label?: string;
  /** data-tour value for the input, so the guided tour can point at it */
  tourId?: string;
}

/** Search the test library by name, code or abbreviation, and add a match. */
export function TestSearch({ exclude, onAdd, label = 'Add a test', tourId }: TestSearchProps) {
  const { data } = useApp();
  const [query, setQuery] = useState('');

  const q = query.trim();
  const results = searchTests(seedTestList, q, exclude);
  const rawCode = /^\d+$/.test(q) && !data.tests[q] && !exclude.includes(q) ? q : null;

  const add = (code: string) => {
    onAdd(code);
    setQuery('');
  };

  return (
    <section className="px-4 pt-5">
      <label htmlFor="test-search" className="text-label">
        {label}
      </label>
      <input
        id="test-search"
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Name, code or abbreviation, e.g. CBCD"
        data-tour={tourId}
        autoComplete="off"
        className="mt-1 min-h-primary w-full rounded-xl border-2 border-ink bg-surface px-4 text-body"
      />
      {(results.length > 0 || rawCode) && (
        <ul className="mt-2 flex flex-col gap-2">
          {results.map((t) => {
            const tube = data.key.codes[t.specimen];
            return (
              <li key={t.code}>
                <button
                  type="button"
                  onClick={() => add(t.code)}
                  className="flex min-h-primary w-full items-center gap-3 rounded-xl border-2 border-rule bg-surface px-4 text-left"
                >
                  {tube && <Tube cap={tube.cap} state="empty" size="sm" label={tube.shortName ?? tube.tube} />}
                  <span className="flex-1">
                    <span className="block text-label">{t.name}</span>
                    <span className="block text-caption text-ink-2">
                      {t.code} · {tube?.shortName ?? t.specimen}
                    </span>
                  </span>
                  <span className="text-label">Add</span>
                </button>
              </li>
            );
          })}
          {rawCode && (
            <li>
              <button
                type="button"
                onClick={() => add(rawCode)}
                className="flex min-h-primary w-full items-center justify-between rounded-xl border-2 border-dashed border-ink-2 bg-surface px-4 text-left"
              >
                <span className="text-label">Add code {rawCode} anyway</span>
                <span className="text-caption text-ink-2">Not in the test library</span>
              </button>
            </li>
          )}
        </ul>
      )}
      {q && results.length === 0 && !rawCode && <p className="mt-2 text-body text-ink-2">No tests match "{query}".</p>}
    </section>
  );
}
