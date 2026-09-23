import { describe, expect, it } from 'vitest';
import {
  STORAGE_KEY,
  emptyState,
  loadState,
  mergeConfirmed,
  mergePatients,
  saveState,
  withConfirmed,
  withDraw,
  withOrder,
  withoutConfirmed,
  type KeyValueStore,
} from '../src/lib/storage';
import { resolveTubes } from '../src/lib/resolveTubes';
import { seedConfirmed, seedData, seedPatients } from '../src/lib/seed';

function memoryStore(): KeyValueStore & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => void data.set(k, v),
    removeItem: (k) => void data.delete(k),
  };
}

describe('storage', () => {
  it('round-trips state', () => {
    const store = memoryStore();
    const state = withOrder(emptyState(), 'P002', ['8847', '763']);
    expect(saveState(state, store)).toBe(true);
    expect(loadState(store).orders.P002).toEqual(['8847', '763']);
  });

  it('falls back to empty state on missing, corrupt or old data', () => {
    const store = memoryStore();
    expect(loadState(store)).toEqual(emptyState());
    store.setItem(STORAGE_KEY, '{not json');
    expect(loadState(store)).toEqual(emptyState());
    store.setItem(STORAGE_KEY, JSON.stringify({ version: 0 }));
    expect(loadState(store)).toEqual(emptyState());
  });

  it('works with no storage at all', () => {
    expect(loadState(undefined)).toEqual(emptyState());
    expect(saveState(emptyState(), undefined)).toBe(false);
  });

  it('reports a failed write instead of throwing', () => {
    const full: KeyValueStore = {
      getItem: () => null,
      setItem: () => {
        throw new Error('QuotaExceededError');
      },
      removeItem: () => {},
    };
    expect(saveState(emptyState(), full)).toBe(false);
  });

  it('a confirmed entry saved on a visit is picked up by a later identical order, after reload', () => {
    const store = memoryStore();
    const p001 = seedPatients.find((p) => p.id === 'P001')!;
    const sig = resolveTubes(p001.orderedCodes, seedData()).signature;

    saveState(
      withConfirmed(emptyState(), sig, {
        tubes: [{ code: 'SS', count: 2 }, { code: 'L', count: 1 }],
        source: 'lab',
        recorded: '2026-09-22',
      }),
      store,
    );

    const reloaded = loadState(store);
    const data = { ...seedData(), confirmed: mergeConfirmed(seedConfirmed, reloaded) };
    const later = resolveTubes(['899', '7600', '6399', '10231'], data);
    expect(later.confidence).toBe('lab');
  });

  it('can delete a seed entry, and re-confirming restores it', () => {
    let state = withoutConfirmed(emptyState(), '6399-10231');
    expect(mergeConfirmed(seedConfirmed, state)['6399-10231']).toBeUndefined();
    state = withConfirmed(state, '6399-10231', { tubes: [{ code: 'SS', count: 2 }], source: 'nurse', recorded: '2026-09-22' });
    expect(mergeConfirmed(seedConfirmed, state)['6399-10231'].source).toBe('nurse');
  });

  it('merges edited orders and new draws over seed patients, sorted by visit time', () => {
    let state = withOrder(emptyState(), 'P002', ['8847', '763']);
    state = withDraw(state, 'P002', { date: '2026-09-22', tubes: [{ code: 'B', count: 1 }] });
    const patients = mergePatients(seedPatients, state);
    const p002 = patients.find((p) => p.id === 'P002')!;
    expect(p002.orderedCodes).toEqual(['8847', '763']);
    expect(p002.drawHistory).toHaveLength(1);
    expect(patients.map((p) => p.id)).toEqual(['P001', 'P002', 'P003', 'P004', 'P005', 'P006', 'P007', 'P008']);
  });
});
