import type { Resolution, ResolveWarning, TubeData } from './types';
import { normalizeCodes, signature } from './signature';
import { byDrawOrder, estimateTubes, makeTube } from './estimate';

/**
 * Confirmed first. If the lab (or a nurse) has recorded the tubes for this exact
 * combination of tests, that list is the answer and the estimator never runs.
 * Otherwise fall back to the estimate, always labeled "estimated".
 */
export function resolveTubes(orderedCodes: readonly string[], data: TubeData): Resolution {
  const sig = signature(orderedCodes);
  const confirmed = data.confirmed[sig];

  if (confirmed) {
    const codes = normalizeCodes(orderedCodes);
    const warnings: ResolveWarning[] = [];
    const testsBySpecimen = new Map<string, string[]>();
    for (const code of codes) {
      const test = data.tests[code];
      if (!test) {
        warnings.push({
          kind: 'unknown-test',
          code,
          message: `Test code ${code} isn't in the test library. The tube list below was confirmed for this order, but check the code with the lab.`,
        });
        continue;
      }
      const list = testsBySpecimen.get(test.specimen) ?? [];
      list.push(code);
      testsBySpecimen.set(test.specimen, list);
    }

    const tubes = confirmed.tubes
      .filter((t) => t.count > 0)
      .map((t) => makeTube(t.code, data.key, t.count, testsBySpecimen.get(t.code) ?? [], [], t.name))
      .sort(byDrawOrder);

    return { signature: sig, confidence: confirmed.source, tubes, warnings, confirmed };
  }

  const { tubes, warnings } = estimateTubes(orderedCodes, data);
  return { signature: sig, confidence: 'estimated', tubes, warnings };
}

export function totalTubes(r: Pick<Resolution, 'tubes'>): number {
  return r.tubes.reduce((n, t) => n + t.count, 0);
}
