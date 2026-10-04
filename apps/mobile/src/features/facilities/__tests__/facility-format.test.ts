import type { Facility } from '@naczas/shared';

import {
  accessibilityLabels,
  asOfLabel,
  displayPhone,
  distanceLabel,
  escapeMarkerText,
  facilityA11yLabel,
  mapsUrl,
  telUrl,
  waitLabel,
  waitTone,
  waitWeeks,
} from '../facility-format';

const facility: Facility = {
  id: 'q1',
  benefit: 'KOLONOSKOPIA',
  providerName: 'Szpital Testowy',
  placeName: 'Pracownia Endoskopii',
  address: 'Szpitalna 1',
  locality: 'Warszawa',
  phone: '+48 22 670 91 72',
  lat: 52.19,
  lng: 20.99,
  distanceKm: 3.24,
  firstAvailableDate: null,
  waitDays: 23,
  awaiting: 10,
  anesthesia: null,
  accessibility: { ramp: true, elevator: true, parking: false, toilet: true },
  asOf: '2026-09-01',
};

describe('wait time', () => {
  it('rounds days to weeks, at least 1', () => {
    expect(waitWeeks(23)).toBe(3);
    expect(waitWeeks(1)).toBe(1);
    expect(waitWeeks(null)).toBeNull();
    expect(waitLabel(41)).toBe('ok. 6 tyg.');
    expect(waitLabel(null)).toBe('Brak danych o terminie');
  });

  it('colours by the 14 / 60-day thresholds', () => {
    expect(waitTone(14)).toBe('done');
    expect(waitTone(15)).toBe('this_year');
    expect(waitTone(60)).toBe('this_year');
    expect(waitTone(61)).toBe('act_now');
    expect(waitTone(null)).toBe('later');
  });
});

describe('labels', () => {
  it('formats distance with a Polish decimal comma', () => {
    expect(distanceLabel(3.24)).toBe('3,2 km');
  });

  it('formats NFZ asOf as month.year', () => {
    expect(asOfLabel('2026-09-01')).toBe('09.2026');
  });

  it('lists only available accessibility features, in a fixed order', () => {
    expect(accessibilityLabels(facility.accessibility)).toEqual(['winda', 'podjazd', 'toaleta']);
  });

  it('builds one screen-reader sentence', () => {
    expect(facilityA11yLabel(facility)).toBe('Szpital Testowy, około 3 tyg. oczekiwania, 3,2 km');
    expect(facilityA11yLabel({ ...facility, anesthesia: true })).toBe(
      'Szpital Testowy, około 3 tyg. oczekiwania, 3,2 km, Możliwe znieczulenie',
    );
    expect(facilityA11yLabel({ ...facility, waitDays: null })).toContain(
      'brak danych o czasie oczekiwania',
    );
  });

  it('escapes marker text', () => {
    expect(escapeMarkerText('<b>&')).toBe('&#60;b&#62;&#38;');
  });
});

describe('telUrl — NFZ free-text phone numbers', () => {
  it.each([
    ['+48 22 670 91 72', 'tel:+48226709172'],
    ['+48 25 781 73 30 wew. 330', 'tel:+48257817330'],
    ['23 691-99-25 23 691-99-58', 'tel:+48236919925'],
    ['(22) 502-13-04', 'tel:+48225021304'],
    ['0257583001', 'tel:+48257583001'],
    ['23 6543235 W235', 'tel:+48236543235'],
    ['22-31-86-374, 506293691', 'tel:+48223186374'],
    ['885 900 300', 'tel:+48885900300'],
    ['0048 22 670 91 72', 'tel:+48226709172'],
  ])('%s → %s', (phone, url) => {
    expect(telUrl(phone)).toBe(url);
  });

  it('returns null for missing or unusable numbers', () => {
    expect(telUrl(null)).toBeNull();
    expect(telUrl('brak')).toBeNull();
    expect(telUrl('12345')).toBeNull();
  });
});

describe('mapsUrl', () => {
  it('uses the platform map app', () => {
    expect(mapsUrl(facility, 'ios')).toBe(
      'https://maps.apple.com/?ll=52.19,20.99&q=Szpital%20Testowy',
    );
    expect(mapsUrl(facility, 'android')).toBe('geo:52.19,20.99?q=52.19,20.99(Szpital%20Testowy)');
    expect(mapsUrl(facility, 'web')).toContain('openstreetmap.org/?mlat=52.19&mlon=20.99');
  });
});

describe('displayPhone', () => {
  it.each([
    ['+48 25 781 73 30 wew. 330', '25 781 73 30'],
    ['0048 22 670 91 72', '22 670 91 72'],
    ['22-31-86-374, 506293691', '22 318 63 74'],
    ['885 900 300', '885 900 300'],
    ['506293691', '506 293 691'],
  ])('%s → %s', (phone, shown) => {
    expect(displayPhone(phone)).toBe(shown);
  });

  it('returns null when there is nothing to dial', () => {
    expect(displayPhone(null)).toBeNull();
    expect(displayPhone('brak')).toBeNull();
  });
});
