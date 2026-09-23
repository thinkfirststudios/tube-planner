import { describe, expect, it } from 'vitest';
import { packList, sparesFor } from '../src/lib/packList';
import { resolveTubes } from '../src/lib/resolveTubes';
import { seedData, seedKey, seedPatients } from '../src/lib/seed';

const data = seedData();
const day = seedPatients.map((p) => resolveTubes(p.orderedCodes, data));
const summary = (lines: ReturnType<typeof packList>) => lines.map((l) => [l.code, l.needed, l.spares, l.total]);

describe('packList', () => {
  it('totals the demo day before spares: 12 SST, 7 lavender, 2 light blue', () => {
    expect(summary(packList(day, seedKey, 0))).toEqual([
      ['B', 2, 0, 2],
      ['SS', 12, 0, 12],
      ['L', 7, 0, 7],
    ]);
  });

  it('adds one spare per type by default', () => {
    expect(summary(packList(day, seedKey))).toEqual([
      ['B', 2, 1, 3],
      ['SS', 12, 1, 13],
      ['L', 7, 1, 8],
    ]);
  });

  it('supports spares set per type', () => {
    expect(summary(packList(day, seedKey, { default: 1, SS: 3, B: 0 }))).toEqual([
      ['B', 2, 0, 2],
      ['SS', 12, 3, 15],
      ['L', 7, 1, 8],
    ]);
  });

  it('counts how many visits need each tube', () => {
    expect(packList(day, seedKey, 0).map((l) => [l.code, l.visits])).toEqual([
      ['B', 2],
      ['SS', 6],
      ['L', 6],
    ]);
  });

  it('an empty day is an empty pack list', () => {
    expect(packList([], seedKey)).toEqual([]);
  });

  it('never allows negative spares', () => {
    expect(sparesFor('SS', -2)).toBe(0);
    expect(sparesFor('SS', { default: -1 })).toBe(0);
  });
});
