import { normalizePostalCode, postalCodeToLocation, provinceForCoords } from '../postal';

describe('postal codes', () => {
  it('accepts codes with or without the dash', () => {
    expect(normalizePostalCode(' 00950 ')).toBe('00-950');
    expect(normalizePostalCode('31-120')).toBe('31-120');
  });

  it('rejects anything else', () => {
    expect(normalizePostalCode('3-1120')).toBeNull();
    expect(normalizePostalCode('abcde')).toBeNull();
    expect(postalCodeToLocation('')).toBeNull();
  });

  it.each([
    ['00-950', '07'], // Warszawa
    ['31-120', '06'], // Kraków
    ['80-001', '11'], // Gdańsk
    ['50-001', '01'], // Wrocław
    ['90-001', '05'], // Łódź
    ['15-001', '10'], // Białystok
    ['70-001', '16'], // Szczecin
    ['85-001', '02'], // Bydgoszcz
  ])('%s → province %s, with the capital as centroid', (code, province) => {
    expect(postalCodeToLocation(code)).toMatchObject({ province });
  });
});

describe('provinceForCoords', () => {
  it.each([
    [52.23, 21.01, '07'], // Warszawa
    [51.4, 21.15, '07'], // Radom — closer to Kielce than to Warsaw
    [50.81, 19.12, '12'], // Częstochowa
    [53.01, 18.6, '02'], // Toruń
    [54.52, 18.53, '11'], // Gdynia
    [49.3, 19.95, '06'], // Zakopane
  ])('(%f, %f) → %s', (lat, lng, province) => {
    expect(provinceForCoords(lat, lng)).toBe(province);
  });
});
