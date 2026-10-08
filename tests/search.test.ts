import { describe, expect, it } from 'vitest';
import { normalize, searchTests } from '../src/lib/search';
import { resolveTubes } from '../src/lib/resolveTubes';
import { seedData, seedTestList } from '../src/lib/seed';

const first = (q: string) => searchTests(seedTestList, q)[0]?.code;

describe('searchTests', () => {
  it('finds tests by the abbreviations nurses type', () => {
    expect(first('CBCD')).toBe('6399');
    expect(first('ESR')).toBe('809');
    expect(first('CPK')).toBe('374');
    expect(first('Mag')).toBe('622');
    expect(first('TG')).toBe('896');
  });

  it('finds tests by code, short name and full name', () => {
    expect(first('10231')).toBe('10231');
    expect(first('CMP')).toBe('10231');
    expect(first('c-reactive')).toBe('4420');
  });

  it('ignores case, spaces and punctuation', () => {
    expect(normalize('CBC w/diff')).toBe('cbcwdiff');
    expect(first('cbc w diff')).toBe('6399');
  });

  it('ranks an exact match first', () => {
    expect(first('CK')).toBe('374');
    expect(first('PT')).toBe('8847');
  });

  it('leaves out tests already chosen, and returns nothing for an empty query', () => {
    expect(searchTests(seedTestList, 'CBCD', ['6399'])).toEqual([]);
    expect(searchTests(seedTestList, '  /  ')).toEqual([]);
  });

  it('every alias belongs to only one test', () => {
    const seen = new Map<string, string>();
    for (const t of seedTestList)
      for (const a of t.aliases ?? []) {
        const n = normalize(a);
        expect(seen.get(n) ?? t.code, `alias ${a}`).toBe(t.code);
        seen.set(n, t.code);
      }
  });
});

describe("Dee's test order: CBCD, CMP, ESR, CRP, CK", () => {
  it('turns typed abbreviations into the lab-confirmed tubes', () => {
    const codes = ['CBCD', 'CMP', 'ESR', 'CRP', 'CK'].map(first);
    expect(codes).toEqual(['6399', '10231', '809', '4420', '374']);
    const r = resolveTubes(codes, seedData());
    expect(r.confidence).toBe('lab');
    expect(r.tubes.map((t) => [t.shortName, t.count])).toEqual([
      ['SST', 2],
      ['Lavender', 1],
    ]);
  });
});
