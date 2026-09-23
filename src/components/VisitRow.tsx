import { Link } from 'react-router-dom';
import type { Patient, Resolution } from '../lib/types';
import { ageOn, formatTime, plural, todayIso } from '../lib/format';
import { ConfidencePill } from './ConfidencePill';
import { TubeRow } from './TubeRow';

interface VisitRowProps {
  patient: Patient;
  resolution: Resolution;
  completed?: boolean;
  selected?: boolean;
}

export function VisitRow({ patient, resolution, completed, selected }: VisitRowProps) {
  return (
    <li>
      <Link
        to={`/patients/${patient.id}`}
        aria-current={selected ? 'page' : undefined}
        className={`block min-h-primary rounded-2xl border-2 bg-surface p-4 ${selected ? 'border-ink' : 'border-rule'} ${
          completed ? 'opacity-70' : ''
        }`}
      >
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-label text-ink-2">{formatTime(patient.visitTime)}</span>
          <span className="flex items-center gap-2">
            {completed && <span className="text-caption text-ink">Done</span>}
            <ConfidencePill confidence={resolution.confidence} compact />
          </span>
        </div>
        <div className="mt-1 text-tube">{patient.name}</div>
        <div className="mb-3 text-caption text-ink-2">
          {ageOn(patient.dob, todayIso())} yrs · {plural(patient.orderedCodes.length, 'test')} · {patient.address}
        </div>
        <TubeRow tubes={resolution.tubes} confidence={resolution.confidence} />
        {resolution.warnings.length > 0 && (
          <p className="mt-2 text-label text-blood">
            {plural(resolution.warnings.length, 'test code')} not recognised
          </p>
        )}
      </Link>
    </li>
  );
}
