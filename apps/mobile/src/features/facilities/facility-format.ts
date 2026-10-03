import { format, parseISO } from 'date-fns';

import type { Facility } from '@naczas/shared';

import { t } from '@/i18n';
import { waitBucket, waitBucketUrgency } from '@/theme';

/** NFZ gives an average wait in days; weeks read better and don't pretend to precision. */
export function waitWeeks(waitDays: number | null): number | null {
  return waitDays === null ? null : Math.max(1, Math.round(waitDays / 7));
}

export function waitLabel(waitDays: number | null): string {
  const weeks = waitWeeks(waitDays);
  return weeks === null ? t('facilities.wait.unknown') : t('facilities.wait.weeks', { weeks });
}

export function waitTone(waitDays: number | null) {
  return waitBucketUrgency[waitBucket(waitDays)];
}

/** 3.24 → '3,2 km' (Polish decimal comma). */
export function distanceLabel(km: number): string {
  return t('facilities.distance', { km: km.toFixed(1).replace('.', ',') });
}

/** asOf 'YYYY-MM-DD' (NFZ reports monthly) → 'MM.YYYY'. */
export function asOfLabel(asOf: string): string {
  return format(parseISO(asOf), 'MM.yyyy');
}

export function accessibilityLabels(a: Facility['accessibility']): string[] {
  const order = ['elevator', 'ramp', 'parking', 'toilet'] as const;
  return order.filter((k) => a[k]).map((k) => t(`facilities.accessibility.${k}`));
}

/**
 * NFZ phone fields are free text: "+48 25 781 73 30 wew. 330", "23 691-99-25 23 691-99-58",
 * "(22) 502-13-04", "0257583001". Dial the first Polish number (9 digits); null if none.
 */
export function telUrl(phone: string | null): string | null {
  if (!phone) return null;
  const first = phone.split(/,|;|wew|\bw\s*\d/i)[0] ?? '';
  let digits = first.replace(/\D/g, '');
  if (digits.startsWith('0048')) digits = digits.slice(4);
  else if (digits.length >= 11 && digits.startsWith('48')) digits = digits.slice(2);
  if (digits.length === 10 && digits.startsWith('0')) digits = digits.slice(1);
  // Two numbers written with spaces only ("23 691-99-25 23 691-99-58") → keep the first one.
  if (digits.length > 9) digits = digits.slice(0, 9);
  return digits.length === 9 ? `tel:+48${digits}` : null;
}

/** Link to the platform's map app; facility coordinates are public NFZ data. */
export function mapsUrl(f: Pick<Facility, 'lat' | 'lng' | 'providerName'>, os: string): string {
  const q = encodeURIComponent(f.providerName);
  if (os === 'ios') return `https://maps.apple.com/?ll=${f.lat},${f.lng}&q=${q}`;
  if (os === 'android') return `geo:${f.lat},${f.lng}?q=${f.lat},${f.lng}(${q})`;
  return `https://www.openstreetmap.org/?mlat=${f.lat}&mlon=${f.lng}#map=17/${f.lat}/${f.lng}`;
}

/** Marker labels go into Leaflet divIcon HTML. */
export function escapeMarkerText(s: string): string {
  return s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

/** One sentence for screen readers: name, wait, distance (screens.md §4 A11y). */
export function facilityA11yLabel(f: Facility): string {
  const weeks = waitWeeks(f.waitDays);
  return t('facilities.card.a11y', {
    name: f.providerName,
    wait:
      weeks === null ? t('facilities.wait.a11yUnknown') : t('facilities.wait.a11yWeeks', { weeks }),
    distance: distanceLabel(f.distanceKm),
  });
}

// NFZ registry strings are ALL CAPS ("GABINET STOMATOLOGICZNY EWA ANDREAS", "POZNAŃ-NOWE MIASTO"),
// which is hard to scan. Title-case them, keeping legal forms / acronyms upper and short Polish
// connectives lower.
const KEEP_UPPER = new Set([
  'NFZ',
  'SP.',
  'Z',
  'O.O.',
  'S.A.',
  'S.C.',
  'NZOZ',
  'SPZOZ',
  'SP',
  'ZOZ',
  'POZ',
  'AOS',
  'II',
  'III',
  'IV',
  'VI',
  'VII',
  'VIII',
  'IX',
  'XI',
  'XII',
  'MSWIA',
  'CM',
  'UM',
  'WUM',
  'UCK',
  'USK',
  'SPSK',
]);
const KEEP_LOWER = new Set([
  'i',
  'w',
  'we',
  'na',
  'do',
  'od',
  'oraz',
  'dla',
  'im.',
  'ul.',
  'al.',
  'pl.',
  'os.',
]);

function titleWord(word: string): string {
  // Capitalise after "-" and after a glued abbreviation dot ("os.orła" → "Os.Orła").
  return word.replace(
    /(^|[-.])(\p{L})/gu,
    (_m, sep: string, ch: string) => sep + ch.toLocaleUpperCase('pl'),
  );
}

export function nfzTitleCase(input: string): string {
  const words = input.trim().split(/\s+/);
  return words
    .map((raw, i) => {
      const upper = raw.toLocaleUpperCase('pl');
      // "SP. Z O.O." — keep the legal form intact.
      if (
        KEEP_UPPER.has(upper) &&
        (upper !== 'Z' || words[i + 1]?.toLocaleUpperCase('pl') === 'O.O.')
      ) {
        return upper === 'O.O.' ? 'o.o.' : upper === 'Z' ? 'z' : upper;
      }
      const lower = raw.toLocaleLowerCase('pl');
      if (i > 0 && KEEP_LOWER.has(lower)) return lower;
      return titleWord(lower);
    })
    .join(' ');
}

/** The place line only adds information when it differs from the provider name. */
export function distinctPlaceName(providerName: string, placeName: string): string | null {
  const norm = (s: string) =>
    s
      .toLocaleLowerCase('pl')
      .replace(/[^\p{L}\p{N}]+/gu, ' ')
      .trim();
  const p = norm(providerName);
  const q = norm(placeName);
  if (!q || q === p || p.includes(q) || q.includes(p)) return null;
  return nfzTitleCase(placeName);
}
