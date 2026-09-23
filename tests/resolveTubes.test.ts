import { describe, expect, it } from 'vitest';
import { resolveTubes } from '../src/lib/resolveTubes';
import { estimateTubes } from '../src/lib/estimate';
import { seedData, seedPatients } from '../src/lib/seed';
import type { Resolution, TubeData } from '../src/lib/types';

const data = seedData();
const orderOf = (id: string) => seedPatients.find((p) => p.id === id)!.orderedCodes;
const counts = (r: Pick<Resolution, 'tubes'>) => r.tubes.map((t) => [t.code, t.count]);

describe('resolveTubes with seed data', () => {
  const cases: [string, [string, number][], Resolution['confidence']][] = [
    ['P001', [['SS', 2], ['L', 1]], 'estimated'],
    ['P002', [['B', 1]], 'estimated'],
    ['P003', [['SS', 2], ['L', 1]], 'estimated'],
    ['P004', [['B', 1], ['SS', 2], ['L', 1]], 'estimated'],
    ['P005', [['SS', 2]], 'estimated'],
    ['P006', [['L', 1]], 'estimated'],
    ['P007', [['SS', 2], ['L', 2]], 'estimated'],
    ['P008', [['SS', 2], ['L', 1]], 'lab'],
  ];

  it.each(cases)('%s resolves to the expected tubes in order of draw', (id, expected, confidence) => {
    const r = resolveTubes(orderOf(id), data);
    expect(counts(r)).toEqual(expected);
    expect(r.confidence).toBe(confidence);
  });

  it('P006 warns about unknown code 99999 and does not guess a tube for it', () => {
    const r = resolveTubes(orderOf('P006'), data);
    expect(r.warnings).toHaveLength(1);
    expect(r.warnings[0].code).toBe('99999');
    expect(r.warnings[0].kind).toBe('unknown-test');
    expect(r.warnings[0].message).toContain('99999');
  });

  it('only P006 has warnings', () => {
    for (const p of seedPatients) {
      const r = resolveTubes(p.orderedCodes, data);
      expect(r.warnings.length > 0).toBe(p.id === 'P006');
    }
  });
});

describe('confirmed first', () => {
  it('P008 resolves from the confirmed list without running the estimator', () => {
    // Break every estimator input. If the estimator ran, the answer would change.
    const broken: TubeData = { ...data, tests: {}, key: { ...data.key, masterSerumTube: false } };
    const r = resolveTubes(orderOf('P008'), broken);
    expect(r.confidence).toBe('lab');
    expect(counts(r)).toEqual([['SS', 2], ['L', 1]]);
    expect(r.confirmed?.source).toBe('lab');
  });

  it('the estimator alone agrees with the lab for P008', () => {
    const lab = resolveTubes(orderOf('P008'), data);
    const est = estimateTubes(orderOf('P008'), data);
    expect(counts(est)).toEqual(counts(lab));
  });

  it('matches regardless of the order codes were entered in', () => {
    expect(resolveTubes(['6399', '10231'], data).confidence).toBe('lab');
    expect(resolveTubes(['10231', '6399', '6399'], data).confidence).toBe('lab');
  });

  it('a saved nurse entry resolves with nurse confidence', () => {
    const withNurse: TubeData = {
      ...data,
      confirmed: {
        ...data.confirmed,
        '8847': { tubes: [{ code: 'B', count: 2 }], source: 'nurse', recorded: '2026-09-22' },
      },
    };
    const r = resolveTubes(orderOf('P002'), withNurse);
    expect(r.confidence).toBe('nurse');
    expect(counts(r)).toEqual([['B', 2]]);
  });

  it('a newly confirmed entry is picked up by a later identical order', () => {
    const before = resolveTubes(orderOf('P001'), data);
    expect(before.confidence).toBe('estimated');

    const saved: TubeData = {
      ...data,
      confirmed: {
        ...data.confirmed,
        [before.signature]: {
          tubes: [{ code: 'SS', count: 3 }, { code: 'L', count: 1 }],
          source: 'lab',
          recorded: '2026-09-22',
        },
      },
    };
    const later = resolveTubes([...orderOf('P001')].reverse(), saved);
    expect(later.confidence).toBe('lab');
    expect(counts(later)).toEqual([['SS', 3], ['L', 1]]);
  });

  it('confirmed lists are returned in order of draw even if saved out of order', () => {
    const d: TubeData = {
      ...data,
      confirmed: { '6399-8847': { tubes: [{ code: 'L', count: 1 }, { code: 'B', count: 1 }], source: 'lab', recorded: '2026-09-22' } },
    };
    expect(counts(resolveTubes(['6399', '8847'], d))).toEqual([['B', 1], ['L', 1]]);
  });
});

describe('estimator rules', () => {
  it('removing dedicatedTube from 809 drops P007 to 1 lavender', () => {
    const tests = { ...data.tests, '809': { ...data.tests['809'], dedicatedTube: false } };
    const r = resolveTubes(orderOf('P007'), { ...data, tests });
    expect(counts(r)).toEqual([['SS', 2], ['L', 1]]);
  });

  it('adds tubes when a group exceeds maxTestsPerTube', () => {
    // 5 serum tests at 4 per tube = 2 tubes, + 1 master serum = 3
    const r = estimateTubes(['10231', '7600', '899', '457', '4420'], data);
    expect(counts(r)).toEqual([['SS', 3]]);
  });

  it('adds no master serum tube when there is no serum test', () => {
    expect(counts(estimateTubes(['6399', '496'], data))).toEqual([['L', 1]]);
  });

  it('master serum can be turned off in the key', () => {
    const key = { ...data.key, masterSerumTube: false };
    expect(counts(estimateTubes(['10231'], { ...data, key }))).toEqual([['SS', 1]]);
  });

  it('an empty order needs no tubes', () => {
    const r = resolveTubes([], data);
    expect(r.tubes).toEqual([]);
    expect(r.confidence).toBe('estimated');
  });

  it('only unknown codes means no tubes and a warning each', () => {
    const r = resolveTubes(['99999', '88888'], data);
    expect(r.tubes).toEqual([]);
    expect(r.warnings.map((w) => w.code)).toEqual(['88888', '99999']);
  });

  it('warns when a test points at a specimen missing from the key', () => {
    const tests = { ...data.tests, '1': { code: '1', name: 'Mystery', specimen: 'ZZ' } };
    const r = estimateTubes(['1', '6399'], { ...data, tests });
    expect(counts(r)).toEqual([['L', 1]]);
    expect(r.warnings[0].kind).toBe('unknown-tube');
  });

  it('new tube types in the key need no code change', () => {
    const key = {
      ...data.key,
      codes: {
        ...data.key.codes,
        GY: { tube: 'Gray top', additive: 'Sodium fluoride', cap: 'gray' as const, drawOrder: 6, maxTestsPerTube: 2 },
      },
    };
    const tests = { ...data.tests, '2': { code: '2', name: 'Glucose', specimen: 'GY' } };
    const r = estimateTubes(['2', '6399', '8847'], { ...data, key, tests });
    expect(counts(r)).toEqual([['B', 1], ['L', 1], ['GY', 1]]);
  });
});
