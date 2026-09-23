import type { ConfirmedOrder, ConfirmedOrders, DrawRecord, Patient } from './types';
import type { Spares } from './packList';

/**
 * Demo state lives in localStorage, layered over the seed JSON. Every read and
 * write happens on the device, so the app works with no connection.
 *
 * Seed data is never modified. Saved changes sit on top of it:
 * - confirmed: tube lists added or edited on this device
 * - deletedConfirmed: signatures removed on this device, including seed entries
 * - orders: edited test lists per patient
 * - draws: draw records added on this device, per patient
 * - visits: in-progress visit state (tubes checked off, actual counts)
 */

export const STORAGE_KEY = 'tube-planner:v1';
export const SCHEMA_VERSION = 1;

export interface VisitProgress {
  date: string;
  /** Tube codes checked off as drawn */
  drawn: string[];
  /** Actual counts where they differ from the tube list */
  actual: Record<string, number>;
  completed?: boolean;
}

export interface AppState {
  version: number;
  confirmed: ConfirmedOrders;
  deletedConfirmed: string[];
  orders: Record<string, string[]>;
  draws: Record<string, DrawRecord[]>;
  visits: Record<string, VisitProgress>;
  spares: Exclude<Spares, number>;
}

export function emptyState(): AppState {
  return {
    version: SCHEMA_VERSION,
    confirmed: {},
    deletedConfirmed: [],
    orders: {},
    draws: {},
    visits: {},
    spares: { default: 1 },
  };
}

/** Minimal Storage surface, so tests can pass an in-memory stand-in. */
export type KeyValueStore = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

function defaultStore(): KeyValueStore | undefined {
  try {
    return globalThis.localStorage;
  } catch {
    // Access can throw in private windows or with site data blocked.
    return undefined;
  }
}

export function loadState(store: KeyValueStore | undefined = defaultStore()): AppState {
  if (!store) return emptyState();
  try {
    const raw = store.getItem(STORAGE_KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw) as Partial<AppState>;
    if (parsed.version !== SCHEMA_VERSION) return emptyState();
    return { ...emptyState(), ...parsed, spares: { default: 1, ...parsed.spares } };
  } catch {
    return emptyState();
  }
}

/** Returns false when the write failed (storage full or unavailable). */
export function saveState(state: AppState, store: KeyValueStore | undefined = defaultStore()): boolean {
  if (!store) return false;
  try {
    store.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

export function clearState(store: KeyValueStore | undefined = defaultStore()): void {
  try {
    store?.removeItem(STORAGE_KEY);
  } catch {
    // Nothing to clear.
  }
}

// --- Merging seed data with saved state ---

export function mergeConfirmed(seed: ConfirmedOrders, state: AppState): ConfirmedOrders {
  const merged: ConfirmedOrders = { ...seed, ...state.confirmed };
  for (const sig of state.deletedConfirmed) delete merged[sig];
  return merged;
}

export function mergePatients(seed: readonly Patient[], state: AppState): Patient[] {
  return seed
    .map((p) => ({
      ...p,
      orderedCodes: state.orders[p.id] ?? p.orderedCodes,
      drawHistory: [...p.drawHistory, ...(state.draws[p.id] ?? [])],
    }))
    .sort((a, b) => a.visitTime.localeCompare(b.visitTime));
}

// --- State updates. Pure: each returns a new state. ---

export function withConfirmed(state: AppState, sig: string, entry: ConfirmedOrder): AppState {
  return {
    ...state,
    confirmed: { ...state.confirmed, [sig]: entry },
    deletedConfirmed: state.deletedConfirmed.filter((s) => s !== sig),
  };
}

export function withoutConfirmed(state: AppState, sig: string): AppState {
  const confirmed = { ...state.confirmed };
  delete confirmed[sig];
  return {
    ...state,
    confirmed,
    deletedConfirmed: state.deletedConfirmed.includes(sig) ? state.deletedConfirmed : [...state.deletedConfirmed, sig],
  };
}

export function withOrder(state: AppState, patientId: string, codes: string[] | undefined): AppState {
  const orders = { ...state.orders };
  if (codes) orders[patientId] = codes;
  else delete orders[patientId];
  return { ...state, orders };
}

export function withDraw(state: AppState, patientId: string, record: DrawRecord): AppState {
  return { ...state, draws: { ...state.draws, [patientId]: [...(state.draws[patientId] ?? []), record] } };
}

export function withVisit(state: AppState, patientId: string, progress: VisitProgress | undefined): AppState {
  const visits = { ...state.visits };
  if (progress) visits[patientId] = progress;
  else delete visits[patientId];
  return { ...state, visits };
}

export function withSpares(state: AppState, spares: AppState['spares']): AppState {
  return { ...state, spares };
}
