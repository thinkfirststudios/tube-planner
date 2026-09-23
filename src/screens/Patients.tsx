import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../state';
import { lastDraw } from '../lib/draw';
import { ageOn, formatDate, formatTime, plural, todayIso } from '../lib/format';
import { Button, ScreenHeader, Sheet } from '../components/ui';

export function Patients() {
  const { patients, data, resetDemo } = useApp();
  const [resetting, setResetting] = useState(false);

  return (
    <div className="flex flex-1 flex-col">
      <ScreenHeader title="Patients" subtitle="Everyone on today's schedule, with what was drawn before." />

      <div className="px-4 pb-3">
        <Link
          to="/tests"
          className="flex min-h-primary items-center justify-between rounded-2xl border-2 border-ink bg-surface px-4"
        >
          <span>
            <span className="block text-label">Test library</span>
            <span className="block text-caption text-ink-2">Which tube each test needs</span>
          </span>
          <span aria-hidden="true">→</span>
        </Link>
      </div>

      <ul className="flex flex-col gap-3 px-4">
        {patients.map((p) => {
          const last = lastDraw(p.drawHistory);
          return (
            <li key={p.id}>
              <Link to={`/patients/${p.id}`} className="block rounded-2xl border-2 border-rule bg-surface p-4">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-tube">{p.name}</span>
                  <span className="text-caption text-ink-2">{formatTime(p.visitTime)}</span>
                </div>
                <p className="text-caption text-ink-2">
                  {ageOn(p.dob, todayIso())} yrs · DOB {formatDate(p.dob)} · {p.address}
                </p>
                {last ? (
                  <p className="mt-2 text-body">
                    <span className="text-label">Last draw {formatDate(last.date)}:</span>{' '}
                    {last.tubes.map((t) => `${t.count} ${data.key.codes[t.code]?.shortName ?? t.code}`).join(', ')}
                    {last.note && <span className="block text-ink-2">“{last.note}”</span>}
                  </p>
                ) : (
                  <p className="mt-2 text-body text-ink-2">No draws recorded yet</p>
                )}
                {p.drawHistory.length > 1 && (
                  <p className="text-caption text-ink-2">{plural(p.drawHistory.length, 'draw')} on record</p>
                )}
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="px-4 py-6">
        <Button variant="quiet" onClick={() => setResetting(true)}>
          Reset demo data
        </Button>
      </div>

      <Sheet open={resetting} onClose={() => setResetting(false)} title="Reset demo data?">
        <p className="text-body">
          This clears saved tube lists, order edits, visit progress and draws recorded on this device, and goes back to
          the original demo data.
        </p>
        <div className="mt-4 mb-2 flex gap-3 [&>*]:flex-1">
          <Button big onClick={() => setResetting(false)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            big
            onClick={() => {
              resetDemo();
              setResetting(false);
            }}
          >
            Reset
          </Button>
        </div>
      </Sheet>
    </div>
  );
}
