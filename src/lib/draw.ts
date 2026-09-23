import type { DrawRecord, ResolvedTube, TubeCount } from './types';
import { normalizeCodes } from './signature';

export interface TubeDiff {
  code: string;
  now: number;
  last: number;
}

/** Tube types whose count differs between the current list and a past draw. */
export function diffTubes(current: readonly Pick<ResolvedTube, 'code' | 'count'>[], last: readonly TubeCount[]): TubeDiff[] {
  const codes = new Set([...current.map((t) => t.code), ...last.map((t) => t.code)]);
  const diffs: TubeDiff[] = [];
  for (const code of codes) {
    const now = current.filter((t) => t.code === code).reduce((n, t) => n + t.count, 0);
    const was = last.filter((t) => t.code === code).reduce((n, t) => n + t.count, 0);
    if (now !== was) diffs.push({ code, now, last: was });
  }
  return diffs;
}

export function lastDraw(history: readonly DrawRecord[]): DrawRecord | undefined {
  return [...history].sort((a, b) => b.date.localeCompare(a.date))[0];
}

/** Test codes on today's order that weren't on the last visit's order. */
export function newSinceLast(orderedCodes: readonly string[], last?: DrawRecord): string[] {
  if (!last?.orderedCodes) return [];
  const before = new Set(normalizeCodes(last.orderedCodes));
  return normalizeCodes(orderedCodes).filter((c) => !before.has(c));
}
