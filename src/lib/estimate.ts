import type { ResolveWarning, ResolvedTube, SpecimenKey, Test, TubeData } from './types';
import { normalizeCodes } from './signature';

export interface Estimate {
  tubes: ResolvedTube[];
  warnings: ResolveWarning[];
}

/**
 * Fallback tube estimate from the specimen key rules in data/specimen-key.json.
 * Only used when no confirmed tube list exists for the order.
 *
 * - Unknown test codes produce a warning and are left out. Never guess a tube.
 * - Tests are grouped by specimen code.
 * - Tubes per group = ceil(regular tests / maxTestsPerTube) + 1 per dedicated test.
 * - Master serum rule: one extra serum tube when any serum test is ordered.
 * - Result is sorted by order of draw.
 */
export function estimateTubes(
  orderedCodes: readonly string[],
  data: Pick<TubeData, 'tests' | 'key'>,
): Estimate {
  const { tests, key } = data;
  const warnings: ResolveWarning[] = [];
  const groups = new Map<string, Test[]>();

  for (const code of normalizeCodes(orderedCodes)) {
    const test = tests[code];
    if (!test) {
      warnings.push({
        kind: 'unknown-test',
        code,
        message: `Test code ${code} isn't in the test library, so no tube was counted for it. Check the order with the lab.`,
      });
      continue;
    }
    if (!key.codes[test.specimen]) {
      warnings.push({
        kind: 'unknown-tube',
        code,
        message: `${test.name} (${code}) needs specimen "${test.specimen}", which isn't in the specimen key. No tube was counted for it.`,
      });
      continue;
    }
    const list = groups.get(test.specimen) ?? [];
    list.push(test);
    groups.set(test.specimen, list);
  }

  const tubes: ResolvedTube[] = [];
  for (const [specimen, groupTests] of groups) {
    const type = key.codes[specimen];
    const regular = groupTests.filter((t) => !t.dedicatedTube);
    const dedicated = groupTests.filter((t) => t.dedicatedTube);
    const perTube = Math.max(1, type.maxTestsPerTube);
    const notes: string[] = [];

    let count = Math.ceil(regular.length / perTube);
    if (regular.length > perTube) {
      notes.push(`${regular.length} tests, up to ${perTube} per tube`);
    }
    for (const t of dedicated) {
      count += 1;
      notes.push(`${t.shortName ?? t.name} needs its own tube`);
    }
    tubes.push(makeTube(specimen, key, count, groupTests.map((t) => t.code), notes));
  }

  applyMasterSerum(tubes, key);
  tubes.sort(byDrawOrder);
  return { tubes, warnings };
}

function applyMasterSerum(tubes: ResolvedTube[], key: SpecimenKey) {
  if (!key.masterSerumTube) return;
  const hasSerum = tubes.some((t) => key.codes[t.code]?.serum);
  if (!hasSerum) return;

  const masterCode = key.masterSerumCode ?? 'SS';
  const existing = tubes.find((t) => t.code === masterCode);
  if (existing) {
    existing.count += 1;
    existing.notes.push('+1 master serum tube');
  } else if (key.codes[masterCode]) {
    tubes.push(makeTube(masterCode, key, 1, [], ['Master serum tube']));
  }
}

export function makeTube(
  code: string,
  key: SpecimenKey,
  count: number,
  tests: string[],
  notes: string[] = [],
  fallbackName?: string,
): ResolvedTube {
  const type = key.codes[code];
  return {
    code,
    name: type?.tube ?? fallbackName ?? code,
    shortName: type?.shortName ?? type?.tube ?? fallbackName ?? code,
    cap: type?.cap ?? 'gray',
    // Tubes missing from the key go last, so they never jump ahead in the draw.
    drawOrder: type?.drawOrder ?? 99,
    count,
    tests,
    notes,
  };
}

export function byDrawOrder(a: { drawOrder: number; code: string }, b: { drawOrder: number; code: string }) {
  return a.drawOrder - b.drawOrder || a.code.localeCompare(b.code);
}
