import type { Confidence } from '../lib/types';
import { confidenceLabel } from '../lib/format';

const styles: Record<Confidence, string> = {
  // Settled
  lab: 'bg-ink text-surface border-2 border-ink',
  // Trusted
  nurse: 'bg-surface text-ink border-2 border-ink',
  // Provisional, invites confirmation
  estimated: 'bg-transparent text-ink-2 border-2 border-dashed border-ink-2',
};

export function ConfidencePill({ confidence, compact = false }: { confidence: Confidence; compact?: boolean }) {
  const label = confidenceLabel[confidence];
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full ${styles[confidence]} ${
        compact ? 'px-2 py-0.5 text-caption' : 'px-3 py-1 text-label'
      }`}
      title={label.full}
    >
      {confidence === 'lab' && <CheckIcon />}
      {compact ? label.short : label.full}
    </span>
  );
}

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
      <path d="M2 6.5 5 9l5-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
