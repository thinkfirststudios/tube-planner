import type { Confidence, DrawRecord, Resolution, Test } from './types';
import { newSinceLast } from './draw';

/** "13:00" -> "1:00 PM" */
export function formatTime(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, '0')} ${suffix}`;
}

/** "2026-09-20" -> "Sep 20, 2026". Parsed as a calendar date, not UTC midnight. */
export function formatDate(iso: string, withYear = true): string {
  const [y, mo, d] = iso.split('-').map(Number);
  const date = new Date(y, mo - 1, d);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', ...(withYear ? { year: 'numeric' } : {}) });
}

export function ageOn(dob: string, onIso: string): number {
  const [by, bm, bd] = dob.split('-').map(Number);
  const [y, m, d] = onIso.split('-').map(Number);
  let age = y - by;
  if (m < bm || (m === bm && d < bd)) age -= 1;
  return age;
}

/** Local date as YYYY-MM-DD */
export function todayIso(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function plural(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`;
}

export function listNames(names: string[]): string {
  if (names.length <= 1) return names.join('');
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`;
}

export const confidenceLabel: Record<Confidence, { full: string; short: string }> = {
  lab: { full: 'Lab confirmed', short: 'Lab' },
  nurse: { full: 'Nurse confirmed', short: 'Nurse' },
  estimated: { full: 'Estimated', short: 'Estimated' },
};

/**
 * One plain sentence on where the tube list came from.
 * For estimates it says why, and invites confirmation.
 */
export function explainResolution(
  r: Resolution,
  orderedCodes: readonly string[],
  tests: Record<string, Test>,
  last?: DrawRecord,
): string {
  if (r.confirmed) {
    const who = r.confidence === 'lab' ? "the lab's collection page" : 'a nurse count';
    return `Confirmed from ${who} on ${formatDate(r.confirmed.recorded)}. The same tests always need the same tubes.`;
  }
  const invite = "Confirm with the lab's count to save it for next time.";
  if (r.tubes.length === 0) {
    return "There are no known tests on this order, so there's nothing to estimate yet. Check the order with the lab.";
  }
  const added = newSinceLast(orderedCodes, last);
  if (added.length > 0) {
    const names = added.map((c) => tests[c]?.shortName ?? tests[c]?.name ?? `Test ${c}`);
    const verb = names.length === 1 ? 'is' : 'are';
    return `${listNames(names)} ${verb} new since the last visit, so these tubes are estimated. ${invite}`;
  }
  if (last) {
    return `This order hasn't been confirmed yet, so these tubes are estimated. ${invite}`;
  }
  return `This combination of tests hasn't been confirmed yet, so these tubes are estimated. ${invite}`;
}
