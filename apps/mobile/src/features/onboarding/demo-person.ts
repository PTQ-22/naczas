import type { CallPatientDetails, Profile } from '@naczas/shared';

import { DEMO_KASIA_ID, DEMO_MAMA_ID } from './demo-ids';

/**
 * Made-up personal data for the two demo profiles only, so the "Zadzwoń za mnie" agent has
 * something to give when the clinic asks (Settings → "Dane w rozmowach AI" decides what).
 * Real profiles have none: the app never collects these fields.
 */
interface DemoPerson {
  firstName: string;
  lastName: string;
  /** Month and day of birth; the year comes from the profile (it moves with "today"). */
  birthMonthDay: string;
  /** Last 4 digits of the PESEL before the check digit (10th digit even = female). */
  peselSerial: string;
  phone: string;
  address: string;
}

const DEMO_PEOPLE: Record<string, DemoPerson> = {
  [DEMO_MAMA_ID]: {
    firstName: 'Ewa',
    lastName: 'Nowak',
    birthMonthDay: '03-15',
    peselSerial: '0482',
    phone: '600 100 200',
    address: 'ul. Półwiejska 12/4, 61-888 Poznań',
  },
  [DEMO_KASIA_ID]: {
    firstName: 'Katarzyna',
    lastName: 'Nowak',
    birthMonthDay: '06-11',
    peselSerial: '0794',
    phone: '600 300 400',
    address: 'ul. Półwiejska 12/4, 61-888 Poznań',
  },
};

const PESEL_WEIGHTS = [1, 3, 7, 9, 1, 3, 7, 9, 1, 3];

/** A checksum-valid PESEL for a birth date (YYYY-MM-DD, years 1900–2099) and a serial. */
export function demoPesel(birthDate: string, serial: string): string {
  const [y = '0', m = '0', d = '0'] = birthDate.split('-');
  const year = Number(y);
  const month = Number(m) + (year >= 2000 ? 20 : 0); // PESEL encodes the century in the month
  const digits = `${y.slice(2)}${String(month).padStart(2, '0')}${d}${serial}`;
  const sum = digits.split('').reduce((s, c, i) => s + Number(c) * (PESEL_WEIGHTS[i] ?? 0), 0);
  return `${digits}${(10 - (sum % 10)) % 10}`;
}

/** Full mock details for a demo profile; undefined for real profiles. */
export function demoPersonDetails(profile: Profile): Required<CallPatientDetails> | undefined {
  const p = DEMO_PEOPLE[profile.id];
  if (!p) return undefined;
  const birthDate = `${profile.birthYear}-${p.birthMonthDay}`;
  return {
    firstName: p.firstName,
    lastName: p.lastName,
    pesel: demoPesel(birthDate, p.peselSerial),
    birthDate,
    phone: p.phone,
    address: p.address,
  };
}
