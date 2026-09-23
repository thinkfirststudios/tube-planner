/**
 * Normalize an order to its lookup key: unique test codes, sorted ascending,
 * joined by "-". CMP (10231) + CBC (6399) becomes "6399-10231".
 *
 * Numeric codes sort by value, not as text, so 6399 comes before 10231.
 */
export function signature(codes: readonly string[]): string {
  return normalizeCodes(codes).join('-');
}

/** Trimmed, de-duplicated, sorted test codes. Blank entries are dropped. */
export function normalizeCodes(codes: readonly string[]): string[] {
  const unique = new Set(codes.map((c) => String(c).trim()).filter(Boolean));
  return [...unique].sort(compareCodes);
}

export function compareCodes(a: string, b: string): number {
  const na = Number(a);
  const nb = Number(b);
  const aNum = a !== '' && Number.isFinite(na);
  const bNum = b !== '' && Number.isFinite(nb);
  if (aNum && bNum) return na - nb || a.localeCompare(b);
  if (aNum) return -1;
  if (bNum) return 1;
  return a.localeCompare(b);
}

export function codesFromSignature(sig: string): string[] {
  return sig ? sig.split('-') : [];
}
