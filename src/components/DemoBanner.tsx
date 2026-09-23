import { useEffect, useState } from 'react';
import { useApp } from '../state';

export function DemoBanner() {
  const online = useOnline();
  const { saved } = useApp();
  return (
    <div className="pt-safe bg-ink text-surface">
      <p className="flex flex-wrap items-center justify-center gap-x-3 px-4 py-1.5 text-center text-caption">
        <span>Demo data. Not for clinical use.</span>
        {!online && <span aria-live="polite">· Offline. Everything still works.</span>}
        {!saved && <span role="alert">· Changes can't be saved on this device.</span>}
      </p>
    </div>
  );
}

function useOnline() {
  const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine));
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);
  return online;
}
