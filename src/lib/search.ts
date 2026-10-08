import type { Test } from './types';

/** Lowercase letters and digits only, so "CBC w/diff" and "cbc w diff" match. */
export function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Tests matching what the nurse typed: code, name, short name or any alias.
 * Exact matches come first ("CK" before "CKMB"), then prefixes, then anywhere
 * in the text. Codes in `exclude` (already on the order) are left out.
 */
export function searchTests(tests: readonly Test[], query: string, exclude: readonly string[] = []): Test[] {
  const q = normalize(query);
  if (!q) return [];
  const ranked: { test: Test; rank: number; index: number }[] = [];
  tests.forEach((test, index) => {
    if (exclude.includes(test.code)) return;
    const names = [test.code, test.name, test.shortName ?? '', ...(test.aliases ?? [])].map(normalize).filter(Boolean);
    const rank = names.some((n) => n === q) ? 0 : names.some((n) => n.startsWith(q)) ? 1 : names.some((n) => n.includes(q)) ? 2 : -1;
    if (rank >= 0) ranked.push({ test, rank, index });
  });
  return ranked.sort((a, b) => a.rank - b.rank || a.index - b.index).map((r) => r.test);
}
