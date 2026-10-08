import { useEffect, useRef } from 'react';
import { HashRouter, Navigate, Route, Routes, matchPath, useLocation } from 'react-router-dom';
import { AppProvider, useIsTablet } from './state';
import { DemoBanner } from './components/DemoBanner';
import { BottomNav } from './components/BottomNav';
import { TourPanel, TourProvider } from './components/Tour';
import { TodaysVisits } from './screens/TodaysVisits';
import { PackList } from './screens/PackList';
import { PatientVisit } from './screens/PatientVisit';
import { ConfirmTubesForOrder, ConfirmTubesForPatient } from './screens/ConfirmTubes';
import { EditOrder } from './screens/EditOrder';
import { SavedOrders } from './screens/SavedOrders';
import { TestLibrary } from './screens/TestLibrary';
import { Patients } from './screens/Patients';
import { LookUp } from './screens/LookUp';

// Hash routes: reliable for an offline PWA on any static host, no server rewrites needed.
export default function App() {
  return (
    <AppProvider>
      <HashRouter>
        <TourProvider>
          <Shell />
        </TourProvider>
      </HashRouter>
    </AppProvider>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<TodaysVisits />} />
      <Route path="/lookup" element={<LookUp />} />
      <Route path="/pack" element={<PackList />} />
      <Route path="/orders" element={<SavedOrders />} />
      <Route path="/orders/:sig" element={<ConfirmTubesForOrder />} />
      <Route path="/patients" element={<Patients />} />
      <Route path="/patients/:id" element={<PatientVisit />} />
      <Route path="/patients/:id/confirm" element={<ConfirmTubesForPatient />} />
      <Route path="/patients/:id/order" element={<EditOrder />} />
      <Route path="/tests" element={<TestLibrary />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

/**
 * Phone: one column. Tablet: visit list on the left, selected patient on the right,
 * for Today and anything under a patient. Other screens stay a readable column
 * rather than stretching the phone layout.
 */
function Shell() {
  const tablet = useIsTablet();
  const { pathname } = useLocation();
  const visit = matchPath('/patients/:id/*', pathname);
  const twoPane = tablet && (pathname === '/' || visit !== null);
  const paneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    paneRef.current?.scrollTo({ top: 0 });
  }, [pathname]);

  return (
    <div className="flex h-dvh flex-col">
      <DemoBanner />
      <main className="flex min-h-0 flex-1">
        {twoPane ? (
          <>
            <div className="flex w-[380px] shrink-0 flex-col overflow-y-auto border-r border-rule lg:w-[420px]">
              <TodaysVisits selectedId={visit?.params.id} />
            </div>
            <div ref={paneRef} className="flex min-w-0 flex-1 flex-col overflow-y-auto">
              <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col">
                {pathname === '/' ? <ChooseVisit /> : <AppRoutes />}
              </div>
            </div>
          </>
        ) : (
          <div ref={paneRef} className="flex min-w-0 flex-1 flex-col overflow-y-auto">
            <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col">
              <AppRoutes />
            </div>
          </div>
        )}
      </main>
      <TourPanel />
      <BottomNav />
    </div>
  );
}

function ChooseVisit() {
  return (
    <div className="flex flex-1 items-center justify-center p-8 text-center">
      <div>
        <p className="font-display text-section">Choose a visit</p>
        <p className="mt-1 text-body text-ink-2">Tap a patient on the left to see which tubes to draw.</p>
      </div>
    </div>
  );
}
