import { describe, expect, it } from 'vitest';
import { diffTubes, lastDraw, newSinceLast } from '../src/lib/draw';
import { resolveTubes } from '../src/lib/resolveTubes';
import { seedData, seedPatients } from '../src/lib/seed';

const data = seedData();
const patient = (id: string) => seedPatients.find((p) => p.id === id)!;

describe('draw history', () => {
  it('P001 drew the same tubes last time', () => {
    const p = patient('P001');
    expect(diffTubes(resolveTubes(p.orderedCodes, data).tubes, lastDraw(p.drawHistory)!.tubes)).toEqual([]);
  });

  it('P007 drew one fewer SST last time', () => {
    const p = patient('P007');
    expect(diffTubes(resolveTubes(p.orderedCodes, data).tubes, lastDraw(p.drawHistory)!.tubes)).toEqual([
      { code: 'SS', now: 2, last: 1 },
    ]);
  });

  it('TSH is new on the P001 order since the last visit', () => {
    const p = patient('P001');
    expect(newSinceLast(p.orderedCodes, lastDraw(p.drawHistory))).toEqual(['899']);
  });

  it('picks the most recent draw', () => {
    expect(lastDraw([{ date: '2026-01-01', tubes: [] }, { date: '2026-05-01', tubes: [] }])!.date).toBe('2026-05-01');
    expect(lastDraw([])).toBeUndefined();
  });
});
