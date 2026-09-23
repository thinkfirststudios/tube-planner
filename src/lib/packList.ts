import type { CapColor, Resolution, SpecimenKey } from './types';
import { byDrawOrder, makeTube } from './estimate';

export interface PackLine {
  code: string;
  name: string;
  shortName: string;
  cap: CapColor;
  drawOrder: number;
  /** Tubes the day's orders need */
  needed: number;
  spares: number;
  /** needed + spares */
  total: number;
  /** How many of the day's visits need this tube */
  visits: number;
}

/**
 * Spares per tube type. A number applies to every type; a map sets each type,
 * with `default` covering any type not listed.
 */
export type Spares = number | { default: number; [code: string]: number };

export function sparesFor(code: string, spares: Spares): number {
  if (typeof spares === 'number') return Math.max(0, spares);
  return Math.max(0, spares[code] ?? spares.default ?? 0);
}

/** Totals every tube across the day's visits, plus spares, in order of draw. */
export function packList(resolutions: readonly Pick<Resolution, 'tubes'>[], key: SpecimenKey, spares: Spares = 1): PackLine[] {
  const lines = new Map<string, PackLine>();

  for (const r of resolutions) {
    for (const t of r.tubes) {
      if (t.count <= 0) continue;
      let line = lines.get(t.code);
      if (!line) {
        const base = makeTube(t.code, key, 0, [], [], t.name);
        line = {
          code: t.code,
          name: base.name,
          shortName: base.shortName,
          cap: base.cap,
          drawOrder: base.drawOrder,
          needed: 0,
          spares: 0,
          total: 0,
          visits: 0,
        };
        lines.set(t.code, line);
      }
      line.needed += t.count;
      line.visits += 1;
    }
  }

  const result = [...lines.values()];
  for (const line of result) {
    line.spares = sparesFor(line.code, spares);
    line.total = line.needed + line.spares;
  }
  return result.sort(byDrawOrder);
}
