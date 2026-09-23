import testsJson from '../data/tests.json';
import keyJson from '../data/specimen-key.json';
import confirmedJson from '../data/confirmed-orders.json';
import patientsJson from '../data/patients.json';
import type { ConfirmedOrders, Patient, SpecimenKey, Test, TubeData } from './types';

// Seed data, typed. All lab rules live in src/data/*.json.

export const seedTestList: Test[] = testsJson.tests as Test[];

export const seedTests: Record<string, Test> = Object.fromEntries(seedTestList.map((t) => [t.code, t]));

export const seedKey: SpecimenKey = {
  verified: keyJson.verified,
  masterSerumTube: keyJson.masterSerumTube,
  masterSerumCode: keyJson.masterSerumCode,
  codes: keyJson.codes as SpecimenKey['codes'],
};

export const seedConfirmed: ConfirmedOrders = confirmedJson as ConfirmedOrders;

export const seedPatients: Patient[] = patientsJson.patients as Patient[];

export const demoDate: string = patientsJson.demoDate;

export function seedData(): TubeData {
  return {
    tests: seedTests,
    key: seedKey,
    confirmed: structuredClone(seedConfirmed),
  };
}
