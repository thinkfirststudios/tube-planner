import { describe, expect, it } from 'vitest';
import { TOUR_PATIENT, TOUR_STEPS, advance, newSession, quit, summarize } from '../src/lib/tour';
import { emptyState, withOrder, withVisit } from '../src/lib/storage';
import { QUEUE_KEY, enqueue, flush, readQueue } from '../src/lib/feedback';
import type { KeyValueStore } from '../src/lib/storage';

const extra = { device: 'phone', appVersion: 'test' };
const step = (id: string) => TOUR_STEPS.find((s) => s.id === id)!;

function memoryStore(): KeyValueStore & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => void data.set(k, v),
    removeItem: (k) => void data.delete(k),
  };
}

describe('tour steps', () => {
  it('has unique ids, and every task can tell when it is done', () => {
    const ids = TOUR_STEPS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const s of TOUR_STEPS) if (s.kind === 'task') expect(s.done).toBeTypeOf('function');
  });

  it('detects opening the visit', () => {
    const s = step('open-visit');
    expect(s.done!({ pathname: '/', state: emptyState() })).toBe(false);
    expect(s.done!({ pathname: `/patients/${TOUR_PATIENT}`, state: emptyState() })).toBe(true);
  });

  it('detects a tube checked off', () => {
    const state = withVisit(emptyState(), TOUR_PATIENT, { date: '2026-09-29', drawn: ['SS'], actual: {} });
    expect(step('mark-drawn').done!({ pathname: '/', state: emptyState() })).toBe(false);
    expect(step('mark-drawn').done!({ pathname: '/', state })).toBe(true);
  });

  it('needs both Magnesium and Phosphorus on the order', () => {
    const one = withOrder(emptyState(), TOUR_PATIENT, ['10231', '6399', '622']);
    const both = withOrder(emptyState(), TOUR_PATIENT, ['10231', '6399', '622', '718']);
    expect(step('edit-order').done!({ pathname: '/', state: one })).toBe(false);
    expect(step('edit-order').done!({ pathname: '/', state: both })).toBe(true);
  });
});

describe('tour session', () => {
  it('logs each step with its outcome and time, then moves to the survey', () => {
    let s = newSession(emptyState(), true, 0, 'abc');
    TOUR_STEPS.forEach((_, i) => {
      s = advance(s, i === 1 ? 'skipped' : 'done', (i + 1) * 10_000);
    });
    expect(s.phase).toBe('survey');
    expect(s.log).toHaveLength(TOUR_STEPS.length);
    expect(s.log[0]).toEqual({ id: 'today', outcome: 'done', ms: 10_000 });
    expect(s.log[1].outcome).toBe('skipped');
    // Advancing past the end changes nothing.
    expect(advance(s, 'done', 999_999)).toBe(s);
  });

  it('records where the person stopped when they end early', () => {
    let s = newSession(emptyState(), true, 0, 'abc');
    s = advance(s, 'done', 5_000);
    s = quit(s, 8_000);
    expect(s.phase).toBe('survey');
    expect(s.quitAt).toBe('open-visit');
  });

  it('keeps the snapshot of the person’s own data', () => {
    const own = withOrder(emptyState(), 'P001', ['6399']);
    expect(newSession(own, false, 0).snapshot).toBe(own);
  });
});

describe('summarize', () => {
  it('makes one flat row with a column per step', () => {
    let s = newSession(emptyState(), true, 0, 'abc');
    s = advance(s, 'done', 4_000);
    s = advance(s, 'skipped', 34_000);
    s = quit(s, 40_000);
    const row = summarize(s, { ease: 4, confusing: '  the pack list  ', wouldUse: 'Maybe', nameRole: 'RN' }, 60_000, extra);

    expect(row).toMatchObject({
      session: 'abc',
      finished: 'No',
      'stopped at': 'read-visit',
      'steps done': 1,
      'steps skipped': 1,
      'total seconds': 60,
      'step: today': 'done 4s',
      'step: open-visit': 'skipped 30s',
      'step: read-visit': '',
      'ease (1-5)': 4,
      confusing: 'the pack list',
      'would use': 'Maybe',
      'name or role': 'RN',
      device: 'phone',
    });
    for (const v of Object.values(row)) expect(['string', 'number']).toContain(typeof v);
  });

  it('leaves survey columns blank when skipped', () => {
    const row = summarize(newSession(emptyState(), true, 0, 'abc'), {}, 1_000, extra);
    expect(row['ease (1-5)']).toBe('');
    expect(row['name or role']).toBe('');
    expect(row.finished).toBe('Yes');
  });
});

describe('feedback queue', () => {
  it('sends queued results and clears them', async () => {
    const store = memoryStore();
    enqueue(store, { session: 'a' });
    enqueue(store, { session: 'b' });
    const sent: string[] = [];
    const n = await flush('https://example.test', store, async (_u, r) => void sent.push(String(r.session)));
    expect(n).toBe(2);
    expect(sent).toEqual(['a', 'b']);
    expect(store.data.has(QUEUE_KEY)).toBe(false);
  });

  it('keeps results when the send fails, for next time', async () => {
    const store = memoryStore();
    enqueue(store, { session: 'a' });
    enqueue(store, { session: 'b' });
    let calls = 0;
    const n = await flush('https://example.test', store, async () => {
      if (calls++ === 1) throw new Error('offline');
    });
    expect(n).toBe(1);
    expect(readQueue(store)).toEqual([{ session: 'b' }]);
  });

  it('does nothing without a URL', async () => {
    const store = memoryStore();
    enqueue(store, { session: 'a' });
    expect(await flush(undefined, store, async () => {})).toBe(0);
    expect(readQueue(store)).toHaveLength(1);
  });
});
