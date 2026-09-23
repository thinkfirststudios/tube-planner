import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../state';
import { codesFromSignature } from '../lib/signature';
import { resolveTubes } from '../lib/resolveTubes';
import { formatDate } from '../lib/format';
import { ConfidencePill } from '../components/ConfidencePill';
import { TubeRow } from '../components/TubeRow';
import { Button, ScreenHeader, Sheet } from '../components/ui';

export function SavedOrders() {
  const { data, patients, resolutions, deleteConfirmed } = useApp();
  const [deleting, setDeleting] = useState<string | null>(null);

  const entries = Object.entries(data.confirmed).sort(
    ([a, ea], [b, eb]) => eb.recorded.localeCompare(ea.recorded) || a.localeCompare(b),
  );
  const nameOf = (code: string) => data.tests[code]?.shortName ?? data.tests[code]?.name ?? `Unknown ${code}`;

  return (
    <div className="flex flex-1 flex-col">
      <ScreenHeader
        title="Saved orders"
        subtitle="Test combinations with confirmed tubes. Any order with the same tests uses these lists instead of an estimate."
      />

      {entries.length === 0 && (
        <p className="mx-4 rounded-2xl border-2 border-dashed border-ink-2 p-4 text-body">
          Nothing saved yet. Use Confirm tubes on a visit to save the lab's count for that combination of tests.
        </p>
      )}

      <ul className="flex flex-col gap-3 px-4 pb-6">
        {entries.map(([sig, entry]) => {
          const codes = codesFromSignature(sig);
          const usedBy = patients.filter((p) => resolutions[p.id].signature === sig);
          const resolved = resolveTubes(codes, data);
          return (
            <li key={sig} className="rounded-2xl border-2 border-rule bg-surface p-4">
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-tube">{codes.map(nameOf).join(' + ')}</h2>
                <ConfidencePill confidence={entry.source} compact />
              </div>
              <p className="text-caption text-ink-2">
                {sig} · recorded {formatDate(entry.recorded)}
              </p>
              <div className="mt-3">
                <TubeRow tubes={resolved.tubes} confidence={entry.source} />
              </div>
              {entry.notes && <p className="mt-2 text-body">{entry.notes}</p>}
              {usedBy.length > 0 && (
                <p className="mt-2 text-label">Today: {usedBy.map((p) => p.name).join(', ')}</p>
              )}
              <div className="mt-3 flex gap-3">
                <Link
                  to={`/orders/${sig}`}
                  className="inline-flex min-h-tap flex-1 items-center justify-center rounded-xl border-2 border-ink text-label"
                >
                  Edit
                </Link>
                <Button variant="danger" className="flex-1" onClick={() => setDeleting(sig)}>
                  Delete
                </Button>
              </div>
            </li>
          );
        })}
      </ul>

      <Sheet open={deleting !== null} onClose={() => setDeleting(null)} title="Delete saved tubes?">
        <p className="text-body">
          Orders with {deleting ? codesFromSignature(deleting).map(nameOf).join(' + ') : ''} will go back to an
          estimate until someone confirms them again.
        </p>
        <div className="mt-4 mb-2 flex gap-3 [&>*]:flex-1">
          <Button big onClick={() => setDeleting(null)}>
            Keep
          </Button>
          <Button
            variant="danger"
            big
            onClick={() => {
              if (deleting) deleteConfirmed(deleting);
              setDeleting(null);
            }}
          >
            Delete
          </Button>
        </div>
      </Sheet>
    </div>
  );
}
