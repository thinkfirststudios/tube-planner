import { useApp } from '../state';
import { packList } from '../lib/packList';
import { plural } from '../lib/format';
import { Tube } from '../components/Tube';
import { ScreenHeader, Stepper } from '../components/ui';

export function PackList() {
  const { patients, resolutions, data, state, setSpares } = useApp();
  const spares = state.spares;
  const day = patients.map((p) => resolutions[p.id]);
  const lines = packList(day, data.key, spares);

  const needed = lines.reduce((n, l) => n + l.needed, 0);
  const spareTotal = lines.reduce((n, l) => n + l.spares, 0);
  const estimated = day.filter((r) => r.confidence === 'estimated').length;
  const warned = patients.filter((p) => resolutions[p.id].warnings.length > 0);

  const setDefault = (n: number) => setSpares({ default: n });
  const setLine = (code: string, n: number) => setSpares({ ...spares, [code]: n });

  return (
    <div className="flex flex-1 flex-col">
      <ScreenHeader
        title="Pack list"
        subtitle={`Every tube for ${plural(patients.length, 'visit')} today, in order of draw.`}
      />

      <section className="mx-4 mb-4 rounded-2xl border-2 border-ink bg-surface p-4">
        <p className="font-display text-section">
          Pack {needed + spareTotal} tubes
        </p>
        <p className="text-body text-ink-2">
          {needed} for today's orders + {spareTotal} {spareTotal === 1 ? 'spare' : 'spares'}
        </p>
        {estimated > 0 && (
          <p className="mt-2 text-label">
            {estimated} of {day.length} visits are estimated. Totals may change once they're confirmed.
          </p>
        )}
        {warned.map((p) => {
          const r = resolutions[p.id];
          const codes = r.warnings.map((w) => w.code);
          const one = codes.length === 1;
          return (
            <p key={p.id} className="mt-2 text-label text-blood">
              {p.name}: test {one ? 'code' : 'codes'} {codes.join(', ')} {one ? "isn't" : "aren't"} recognised
              {r.confidence === 'estimated'
                ? `, so no tube is counted for ${one ? 'it' : 'them'}.`
                : '. Check with the lab.'}
            </p>
          );
        })}
      </section>

      <ul className="flex flex-col gap-3 px-4">
        {lines.map((l) => (
          <li key={l.code} className="flex items-center gap-4 rounded-2xl border-2 border-rule bg-surface p-4">
            <Tube cap={l.cap} state="empty" count={l.total} size="md" label={l.shortName} />
            <div className="min-w-0 flex-1">
              <h2 className="text-tube">
                {l.total} {l.shortName}
              </h2>
              <p className="text-caption text-ink-2">{l.name}</p>
              <p className="text-label">
                {l.needed} for {plural(l.visits, 'visit')} + {l.spares} {l.spares === 1 ? 'spare' : 'spares'}
              </p>
            </div>
            <Stepper value={l.spares} onChange={(n) => setLine(l.code, n)} label={`spare ${l.shortName}`} />
          </li>
        ))}
      </ul>

      <section className="m-4 flex items-center justify-between gap-4 rounded-2xl border-2 border-rule bg-surface p-4">
        <div>
          <h2 className="text-label">Spares per tube type</h2>
          <p className="text-caption text-ink-2">Sets every type. Adjust one type with its own buttons above.</p>
        </div>
        <Stepper value={spares.default} onChange={setDefault} label="spares per type" />
      </section>
    </div>
  );
}
