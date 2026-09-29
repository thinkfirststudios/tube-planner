import type { CapColor } from '../lib/types';

export type TubeState = 'empty' | 'filled' | 'estimated';

const sizes = {
  sm: { w: 16, h: 40 },
  md: { w: 28, h: 70 },
  lg: { w: 40, h: 100 },
} as const;

interface TubeProps {
  cap: CapColor;
  state: TubeState;
  count?: number;
  size?: keyof typeof sizes;
  /** Accessible name, e.g. "SST" */
  label: string;
}

/**
 * A collection tube: cap color on top, count on the body.
 * empty = confirmed, not yet drawn. filled = drawn. estimated = dashed until confirmed.
 */
export function Tube({ cap, state, count, size = 'md', label }: TubeProps) {
  const { w, h } = sizes[size];
  const filled = state === 'filled';
  const dashed = state === 'estimated';
  const stateText = filled ? 'drawn' : dashed ? 'estimated' : 'not drawn yet';
  const showCount = count !== undefined && size !== 'sm';

  return (
    <svg
      width={w}
      height={h}
      viewBox="0 0 40 100"
      role="img"
      aria-label={`${count !== undefined ? `${count} ` : ''}${label}, ${stateText}`}
      className="shrink-0"
    >
      {/* Body */}
      <path
        d="M8 20 H32 V82 A12 12 0 0 1 8 82 Z"
        fill="var(--tube-glass)"
        stroke="var(--tube-outline)"
        strokeWidth={dashed ? 2.5 : 2}
        strokeDasharray={dashed ? '5 4' : undefined}
      />
      {/* Blood fill, leaving headspace under the cap */}
      {filled && <path d="M9 34 H31 V82 A11 11 0 0 1 9 82 Z" fill="var(--color-blood)" />}
      {/* Cap */}
      <rect x="4" y="2" width="32" height="20" rx="4" fill={`var(--cap-${cap})`} stroke="var(--color-ink)" strokeWidth="1.5" />
      <rect x="4" y="16" width="32" height="6" fill="var(--color-ink)" opacity="0.15" />
      {showCount && (
        <text
          x="20"
          y="66"
          textAnchor="middle"
          fontFamily="'Public Sans', system-ui, sans-serif"
          fontWeight="700"
          fontSize={count !== undefined && count >= 10 ? 15 : 22}
          fill={filled ? 'var(--color-surface)' : 'var(--color-ink)'}
        >
          {count}
        </text>
      )}
    </svg>
  );
}
