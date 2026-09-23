import { useNavigate } from 'react-router-dom';
import { useApp } from '../state';
import { VisitRow } from '../components/VisitRow';
import { BottomBar } from '../components/BottomBar';
import { Button, ScreenHeader } from '../components/ui';
import { formatDate, plural, todayIso } from '../lib/format';
import { totalTubes } from '../lib/resolveTubes';

export function TodaysVisits({ selectedId }: { selectedId?: string }) {
  const { patients, resolutions, state } = useApp();
  const navigate = useNavigate();

  const tubes = patients.reduce((n, p) => n + totalTubes(resolutions[p.id]), 0);
  const estimated = patients.filter((p) => resolutions[p.id].confidence === 'estimated').length;
  const done = patients.filter((p) => state.visits[p.id]?.completed).length;

  return (
    <div className="flex flex-1 flex-col">
      <ScreenHeader
        title="Today"
        subtitle={
          <>
            {weekday(todayIso())}, {formatDate(todayIso(), false)} · {plural(patients.length, 'visit')} · {plural(tubes, 'tube')}
            {done > 0 && <> · {done} done</>}
            {estimated > 0 && (
              <span className="block text-label">
                {estimated} of {patients.length} tube lists are estimated
              </span>
            )}
          </>
        }
      />
      <ol className="flex flex-col gap-3 px-4 pb-4">
        {patients.map((p) => (
          <VisitRow
            key={p.id}
            patient={p}
            resolution={resolutions[p.id]}
            completed={state.visits[p.id]?.completed}
            selected={p.id === selectedId}
          />
        ))}
      </ol>
      <BottomBar>
        <Button variant="primary" big onClick={() => navigate('/pack')}>
          Pack list
        </Button>
      </BottomBar>
    </div>
  );
}

function weekday(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { weekday: 'long' });
}
