import type { Confidence, ResolvedTube } from '../lib/types';
import { Tube } from './Tube';

/** Compact tube summary for list rows: small tube, count, short name. */
export function TubeRow({ tubes, confidence }: { tubes: ResolvedTube[]; confidence: Confidence }) {
  if (tubes.length === 0) return <span className="text-label text-ink-2">No tubes</span>;
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-1" aria-label="Tubes to draw">
      {tubes.map((t) => (
        <li key={t.code} className="flex items-center gap-1.5">
          <Tube cap={t.cap} state={confidence === 'estimated' ? 'estimated' : 'empty'} size="sm" label={t.shortName} />
          <span className="text-label">
            {t.count} {t.shortName}
          </span>
        </li>
      ))}
    </ul>
  );
}
