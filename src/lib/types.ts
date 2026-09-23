// Shared types. No React here: lib/ must stay testable on its own.

export type CapColor = 'light-blue' | 'red' | 'gold' | 'green' | 'lavender' | 'gray';

export type Confidence = 'lab' | 'nurse' | 'estimated';

export interface Test {
  code: string;
  name: string;
  shortName?: string;
  /** Specimen code, a key into SpecimenKey.codes */
  specimen: string;
  /** Test always needs a tube of its own */
  dedicatedTube?: boolean;
  handlingNote?: string;
}

export interface SpecimenType {
  tube: string;
  shortName?: string;
  additive: string;
  /** Reference hex from the lab key. The UI renders `cap` from design tokens instead. */
  color?: string;
  cap: CapColor;
  drawOrder: number;
  maxTestsPerTube: number;
  /** Serum specimens trigger the master serum rule */
  serum?: boolean;
}

export interface SpecimenKey {
  verified: boolean;
  masterSerumTube: boolean;
  /** Which specimen code the master serum tube is. Defaults to "SS". */
  masterSerumCode?: string;
  codes: Record<string, SpecimenType>;
}

export interface TubeCount {
  code: string;
  name?: string;
  count: number;
}

export interface ConfirmedOrder {
  tubes: TubeCount[];
  source: 'lab' | 'nurse';
  /** ISO date, YYYY-MM-DD */
  recorded: string;
  notes?: string;
}

export type ConfirmedOrders = Record<string, ConfirmedOrder>;

export interface DrawRecord {
  date: string;
  /** Test codes on the order that day, so changes since last visit can be named */
  orderedCodes?: string[];
  tubes: TubeCount[];
  note?: string;
}

export interface Patient {
  id: string;
  name: string;
  dob: string;
  address: string;
  /** 24h HH:MM */
  visitTime: string;
  orderedCodes: string[];
  drawHistory: DrawRecord[];
}

/** Everything the lookup needs. Plain data, so tests can build variants. */
export interface TubeData {
  tests: Record<string, Test>;
  key: SpecimenKey;
  confirmed: ConfirmedOrders;
}

export interface ResolvedTube {
  code: string;
  name: string;
  shortName: string;
  cap: CapColor;
  drawOrder: number;
  count: number;
  /** Test codes collected in this tube type */
  tests: string[];
  /** Why the count is what it is (estimator only), e.g. "+1 master serum" */
  notes: string[];
}

export type WarningKind = 'unknown-test' | 'unknown-tube';

export interface ResolveWarning {
  kind: WarningKind;
  code: string;
  message: string;
}

export interface Resolution {
  signature: string;
  confidence: Confidence;
  tubes: ResolvedTube[];
  warnings: ResolveWarning[];
  /** Set when confidence is lab or nurse */
  confirmed?: ConfirmedOrder;
}
