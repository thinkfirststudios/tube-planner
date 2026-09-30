import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { ConfirmedOrder, DrawRecord, Patient, Resolution, TubeData } from './lib/types';
import { resolveTubes } from './lib/resolveTubes';
import { seedConfirmed, seedKey, seedPatients, seedTests } from './lib/seed';
import {
  clearState,
  emptyState,
  loadState,
  mergeConfirmed,
  mergePatients,
  saveState,
  withConfirmed,
  withDraw,
  withOrder,
  withoutConfirmed,
  withSpares,
  withVisit,
  type AppState,
  type VisitProgress,
} from './lib/storage';

interface AppContextValue {
  state: AppState;
  data: TubeData;
  patients: Patient[];
  resolutions: Record<string, Resolution>;
  /** False when the last write to local storage failed */
  saved: boolean;
  patient(id: string): Patient | undefined;
  saveConfirmed(sig: string, entry: ConfirmedOrder): void;
  deleteConfirmed(sig: string): void;
  setOrder(patientId: string, codes: string[] | undefined): void;
  addDraw(patientId: string, record: DrawRecord): void;
  setVisit(patientId: string, progress: VisitProgress | undefined): void;
  setSpares(spares: AppState['spares']): void;
  resetDemo(): void;
  /** Swap in a whole state, e.g. fresh demo data for the tour and back again */
  replaceState(next: AppState): void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => loadState());
  const [saved, setSaved] = useState(true);

  useEffect(() => {
    setSaved(saveState(state));
  }, [state]);

  const data = useMemo<TubeData>(
    () => ({ tests: seedTests, key: seedKey, confirmed: mergeConfirmed(seedConfirmed, state) }),
    [state],
  );
  const patients = useMemo(() => mergePatients(seedPatients, state), [state]);
  const resolutions = useMemo(
    () => Object.fromEntries(patients.map((p) => [p.id, resolveTubes(p.orderedCodes, data)])),
    [patients, data],
  );

  const update = useCallback((fn: (s: AppState) => AppState) => setState(fn), []);

  const value = useMemo<AppContextValue>(
    () => ({
      state,
      data,
      patients,
      resolutions,
      saved,
      patient: (id) => patients.find((p) => p.id === id),
      saveConfirmed: (sig, entry) => update((s) => withConfirmed(s, sig, entry)),
      deleteConfirmed: (sig) => update((s) => withoutConfirmed(s, sig)),
      setOrder: (id, codes) => update((s) => withOrder(s, id, codes)),
      addDraw: (id, record) => update((s) => withDraw(s, id, record)),
      setVisit: (id, progress) => update((s) => withVisit(s, id, progress)),
      setSpares: (spares) => update((s) => withSpares(s, spares)),
      resetDemo: () => {
        clearState();
        setState(emptyState());
      },
      replaceState: (next) => setState(next),
    }),
    [state, data, patients, resolutions, saved, update],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}

export function useMediaQuery(query: string): boolean {
  const get = () => typeof window !== 'undefined' && window.matchMedia(query).matches;
  const [matches, setMatches] = useState(get);
  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);
  return matches;
}

export const useIsTablet = () => useMediaQuery('(min-width: 768px)');
