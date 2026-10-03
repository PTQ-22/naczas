import type { ProvinceCode } from '@naczas/shared';

export interface ProvincePoint {
  province: ProvinceCode;
  lat: number;
  lng: number;
}

/** Province capitals (NFZ codes, docs/04-data-sources.md) — used as the "centroid" for searches. */
export const PROVINCE_CAPITALS: Record<ProvinceCode, { lat: number; lng: number }> = {
  '01': { lat: 51.11, lng: 17.03 }, // Wrocław
  '02': { lat: 53.12, lng: 18.01 }, // Bydgoszcz
  '03': { lat: 51.25, lng: 22.57 }, // Lublin
  '04': { lat: 52.73, lng: 15.24 }, // Gorzów Wielkopolski
  '05': { lat: 51.76, lng: 19.46 }, // Łódź
  '06': { lat: 50.06, lng: 19.94 }, // Kraków
  '07': { lat: 52.23, lng: 21.01 }, // Warszawa
  '08': { lat: 50.68, lng: 17.93 }, // Opole
  '09': { lat: 50.04, lng: 22.0 }, // Rzeszów
  '10': { lat: 53.13, lng: 23.16 }, // Białystok
  '11': { lat: 54.35, lng: 18.65 }, // Gdańsk
  '12': { lat: 50.26, lng: 19.02 }, // Katowice
  '13': { lat: 50.87, lng: 20.63 }, // Kielce
  '14': { lat: 53.78, lng: 20.48 }, // Olsztyn
  '15': { lat: 52.41, lng: 16.93 }, // Poznań
  '16': { lat: 53.43, lng: 14.55 }, // Szczecin
};

/**
 * Approximate: two-digit postal prefix → province of most codes in that zone. Polish postal
 * zones don't follow province borders exactly (e.g. 26-6xx Radom is mazowieckie while most of
 * 26 is świętokrzyskie), so edge areas may land in the neighbouring province — good enough to
 * pick NFZ queues nearby, which is all we use it for.
 */
const PREFIX_RANGES: [from: number, to: number, province: ProvinceCode][] = [
  [0, 9, '07'], // Warszawa, Siedlce, Płock, Ostrołęka
  [10, 14, '14'], // Olsztyn, Elbląg
  [15, 18, '10'], // Białystok, Suwałki, Łomża
  [19, 19, '14'], // Ełk, Giżycko
  [20, 24, '03'], // Lublin, Chełm, Zamość, Puławy
  [25, 29, '13'], // Kielce, Ostrowiec, Sandomierz
  [30, 34, '06'], // Kraków, Tarnów, Nowy Sącz
  [35, 39, '09'], // Rzeszów, Przemyśl, Krosno
  [40, 44, '12'], // Katowice, Gliwice, Bielsko-Biała
  [45, 49, '08'], // Opole, Nysa, Brzeg
  [50, 59, '01'], // Wrocław, Wałbrzych, Legnica
  [60, 64, '15'], // Poznań, Konin, Kalisz, Leszno
  [65, 69, '04'], // Zielona Góra, Gorzów
  [70, 75, '16'], // Szczecin, Koszalin
  [76, 77, '11'], // Słupsk, Bytów
  [78, 79, '16'], // Kołobrzeg, Wałcz
  [80, 84, '11'], // Gdańsk, Gdynia
  [85, 89, '02'], // Bydgoszcz, Toruń, Włocławek
  [90, 99, '05'], // Łódź, Piotrków, Sieradz
];

const POSTAL_CODE = /^(\d{2})-?(\d{3})$/;

export function normalizePostalCode(input: string): string | null {
  const match = POSTAL_CODE.exec(input.trim());
  return match ? `${match[1]}-${match[2]}` : null;
}

/** Province + capital coordinates for a postal code, or null if it isn't one. */
export function postalCodeToLocation(input: string): ProvincePoint | null {
  const code = normalizePostalCode(input);
  if (!code) return null;
  const prefix = Number(code.slice(0, 2));
  const range = PREFIX_RANGES.find(([from, to]) => prefix >= from && prefix <= to);
  if (!range) return null;
  const province = range[2];
  return { province, ...PROVINCE_CAPITALS[province] };
}

/** Reference towns for nearest-town province lookup from GPS (approximate coordinates). */
const REFERENCE_TOWNS: ProvincePoint[] = [
  ...Object.entries(PROVINCE_CAPITALS).map(([province, p]) => ({
    province: province as ProvinceCode,
    ...p,
  })),
  { province: '01', lat: 51.21, lng: 16.16 }, // Legnica
  { province: '01', lat: 50.77, lng: 16.28 }, // Wałbrzych
  { province: '01', lat: 50.9, lng: 15.73 }, // Jelenia Góra
  { province: '02', lat: 53.01, lng: 18.6 }, // Toruń
  { province: '02', lat: 52.65, lng: 19.07 }, // Włocławek
  { province: '02', lat: 53.48, lng: 18.75 }, // Grudziądz
  { province: '02', lat: 52.79, lng: 18.26 }, // Inowrocław
  { province: '03', lat: 50.72, lng: 23.25 }, // Zamość
  { province: '03', lat: 51.13, lng: 23.47 }, // Chełm
  { province: '03', lat: 52.03, lng: 23.13 }, // Biała Podlaska
  { province: '04', lat: 51.94, lng: 15.51 }, // Zielona Góra
  { province: '05', lat: 51.41, lng: 19.7 }, // Piotrków Trybunalski
  { province: '05', lat: 51.6, lng: 18.73 }, // Sieradz
  { province: '05', lat: 51.96, lng: 20.14 }, // Skierniewice
  { province: '06', lat: 50.01, lng: 20.99 }, // Tarnów
  { province: '06', lat: 49.62, lng: 20.69 }, // Nowy Sącz
  { province: '07', lat: 51.4, lng: 21.15 }, // Radom
  { province: '07', lat: 52.55, lng: 19.71 }, // Płock
  { province: '07', lat: 52.17, lng: 22.29 }, // Siedlce
  { province: '07', lat: 53.08, lng: 21.57 }, // Ostrołęka
  { province: '08', lat: 50.47, lng: 17.33 }, // Nysa
  { province: '08', lat: 50.35, lng: 18.22 }, // Kędzierzyn-Koźle
  { province: '09', lat: 49.78, lng: 22.77 }, // Przemyśl
  { province: '09', lat: 49.69, lng: 21.77 }, // Krosno
  { province: '09', lat: 50.58, lng: 22.05 }, // Stalowa Wola
  { province: '10', lat: 54.1, lng: 22.93 }, // Suwałki
  { province: '10', lat: 53.18, lng: 22.06 }, // Łomża
  { province: '11', lat: 54.46, lng: 17.03 }, // Słupsk
  { province: '11', lat: 53.7, lng: 17.56 }, // Chojnice
  { province: '12', lat: 50.81, lng: 19.12 }, // Częstochowa
  { province: '12', lat: 49.82, lng: 19.04 }, // Bielsko-Biała
  { province: '12', lat: 50.1, lng: 18.55 }, // Rybnik
  { province: '12', lat: 50.29, lng: 18.67 }, // Gliwice
  { province: '13', lat: 50.93, lng: 21.39 }, // Ostrowiec Świętokrzyski
  { province: '13', lat: 50.68, lng: 21.75 }, // Sandomierz
  { province: '14', lat: 54.16, lng: 19.4 }, // Elbląg
  { province: '14', lat: 53.83, lng: 22.36 }, // Ełk
  { province: '15', lat: 52.22, lng: 18.25 }, // Konin
  { province: '15', lat: 51.76, lng: 18.09 }, // Kalisz
  { province: '15', lat: 51.84, lng: 16.57 }, // Leszno
  { province: '15', lat: 53.15, lng: 16.74 }, // Piła
  { province: '15', lat: 52.54, lng: 17.6 }, // Gniezno
  { province: '16', lat: 54.19, lng: 16.17 }, // Koszalin
  { province: '16', lat: 54.18, lng: 15.58 }, // Kołobrzeg
  { province: '16', lat: 53.34, lng: 15.05 }, // Stargard
];

/**
 * Province for GPS coordinates by nearest reference town — offline and works on web
 * (expo-location's reverse geocoding needs a Google key there). Approximate near borders.
 */
export function provinceForCoords(lat: number, lng: number): ProvinceCode {
  // Longitude degrees are ~0.62 of latitude degrees at Poland's latitude.
  const distance = (p: ProvincePoint) => (p.lat - lat) ** 2 + ((p.lng - lng) * 0.62) ** 2;
  let nearest = REFERENCE_TOWNS[0] as ProvincePoint;
  for (const town of REFERENCE_TOWNS) {
    if (distance(town) < distance(nearest)) nearest = town;
  }
  return nearest.province;
}
