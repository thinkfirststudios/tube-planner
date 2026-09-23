import { describe, expect, it } from 'vitest';
import { codesFromSignature, normalizeCodes, signature } from '../src/lib/signature';

describe('signature', () => {
  it('sorts numerically, not as text', () => {
    expect(signature(['10231', '6399'])).toBe('6399-10231');
  });

  it('is the same regardless of order entered', () => {
    expect(signature(['6399', '10231'])).toBe(signature(['10231', '6399']));
  });

  it('drops duplicates and blanks, trims whitespace', () => {
    expect(signature([' 6399', '10231', '6399', '', '  '])).toBe('6399-10231');
  });

  it('handles an empty order', () => {
    expect(signature([])).toBe('');
    expect(codesFromSignature('')).toEqual([]);
  });

  it('puts non-numeric codes after numeric ones', () => {
    expect(normalizeCodes(['ABC', '899', '10231'])).toEqual(['899', '10231', 'ABC']);
  });

  it('round-trips', () => {
    expect(codesFromSignature(signature(['899', '10231', '6399', '7600']))).toEqual(['899', '6399', '7600', '10231']);
  });
});
