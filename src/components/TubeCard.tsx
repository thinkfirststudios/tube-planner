import type { Confidence, ResolvedTube, Test } from '../lib/types';
import { Tube, capLabel } from './Tube';
import { Stepper } from './ui';

interface TubeCardProps {
  step: number;
  tube: ResolvedTube;
  confidence: Confidence;
  tests: Record<string, Test>;
  drawn: boolean;
  onToggleDrawn: () => void;
  /** Actual count for this visit; defaults to the planned count */
  actual: number;
  onActualChange: (n: number) => void;
  /** Tube count on the last visit, when it differs */
  lastCount?: number;
  disabled?: boolean;
}

/** One step in the order of draw: step number, tube, what goes in it, check-off. */
export function TubeCard({
  step,
  tube,
  confidence,
  tests,
  drawn,
  onToggleDrawn,
  actual,
  onActualChange,
  lastCount,
  disabled,
}: TubeCardProps) {
  const state = drawn ? 'filled' : confidence === 'estimated' ? 'estimated' : 'empty';
  const testNames = tube.tests.map((c) => tests[c]?.shortName ?? tests[c]?.name ?? c);
  const changed = actual !== tube.count;
  const handling = tube.tests.map((c) => tests[c]?.handlingNote).filter(Boolean) as string[];

  return (
    <li
      className={`rounded-2xl border-2 bg-surface p-4 ${drawn ? 'border-ink' : 'border-rule'} ${
        lastCount !== undefined ? 'outline-2 outline-offset-2 outline-dashed outline-ink-2' : ''
      }`}
    >
      <div className="flex gap-4">
        <div className="flex flex-col items-center gap-2">
          <span
            className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-ink text-label"
            aria-label={`Step ${step}`}
          >
            {step}
          </span>
          <Tube cap={tube.cap} state={state} count={actual} size="lg" label={tube.shortName} />
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="text-tube">
            {actual} {tube.shortName}
          </h3>
          <p className="text-caption text-ink-2">
            {capLabel[tube.cap]} · {tube.name}
          </p>
          {testNames.length > 0 && <p className="mt-2 text-body">{testNames.join(', ')}</p>}
          {tube.notes.length > 0 && (
            <ul className="mt-1 text-caption text-ink-2">
              {tube.notes.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          )}
          {handling.map((h) => (
            <p key={h} className="mt-1 text-label">
              {h}
            </p>
          ))}
          {lastCount !== undefined && (
            <p className="mt-2 text-label">
              Last visit: {lastCount} {tube.shortName}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={onToggleDrawn}
          disabled={disabled}
          aria-pressed={drawn}
          aria-label={drawn ? `Step ${step}, ${tube.shortName}: drawn. Tap to undo.` : `Mark step ${step}, ${tube.shortName}, as drawn`}
          className={`flex h-[60px] w-[60px] shrink-0 flex-col items-center justify-center self-start rounded-xl border-2 border-ink text-caption ${
            drawn ? 'bg-ink text-surface' : 'bg-surface text-ink'
          }`}
        >
          <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
            {drawn ? (
              <path d="M4 11.5 9 16l9-10" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            ) : (
              <rect x="3" y="3" width="16" height="16" rx="3" fill="none" stroke="currentColor" strokeWidth="2" />
            )}
          </svg>
          {drawn ? 'Drawn' : 'Draw'}
        </button>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 border-t border-rule pt-3">
        <span className="text-label text-ink-2">{changed ? `Planned ${tube.count}, drawing` : 'Tubes drawn'}</span>
        <Stepper value={actual} onChange={onActualChange} label={tube.shortName} min={0} max={10} />
      </div>
    </li>
  );
}
