import type { ISODate, Profile } from '@naczas/shared';

import { ageAt } from './age';

/** Local to packages/rules on purpose — not part of the shared contract. */
export interface ActivityTip {
  id: string;
  title: string; // PL
  body: string; // PL, "small step" language
  /** Weekly target of moderate activity this tip points to. */
  minutesPerWeek: number;
  source: { name: string; url: string };
}

type TipId =
  'adult_general' | 'adult_low' | 'adult_medium' | 'adult_high' | 'senior' | 'senior_low';

// Every number below is from these pages (verified 2026-10-03):
// NCEZ/PZH summary of WHO 2020: 150–300 min/week moderate (adults; 150 for 65+), strength ≥ 2 days,
// 65+ balance + strength ≥ 3 days, "każda aktywność lepsza niż żadna", gradual increase.
// pacjent.gov.pl: 30 min of moderate activity on 5 days a week.
const WHO_2020_PL = {
  name: 'Nowe zalecenia WHO dotyczące aktywności fizycznej (2020) — NCEZ, PZH',
  url: 'https://ncez.pzh.gov.pl/ruch_i_zywienie/nowe-zalecenia-who-dotyczace-aktywnosci-fizycznej/',
};
const PACJENT = {
  name: 'Przez ćwiczenia do zdrowia — pacjent.gov.pl',
  url: 'https://pacjent.gov.pl/aktualnosc/przez-cwiczenia-do-zdrowia',
};

export const ACTIVITY_TIPS: Record<TipId, ActivityTip> = {
  adult_general: {
    id: 'adult_general',
    title: 'Ruch na co dzień',
    body: 'Każda aktywność jest lepsza niż żadna. Dorosłym zaleca się 150–300 minut umiarkowanego ruchu w tygodniu, np. szybkiego marszu, oraz ćwiczenia wzmacniające mięśnie co najmniej 2 dni w tygodniu.',
    minutesPerWeek: 150,
    source: WHO_2020_PL,
  },
  adult_low: {
    id: 'adult_low',
    title: 'Mały krok: krótki spacer',
    body: 'Każda aktywność jest lepsza niż żadna. Zacznij od krótkiego spaceru w ciągu dnia i stopniowo go wydłużaj. Z czasem możesz dojść do 150 minut umiarkowanego ruchu w tygodniu.',
    minutesPerWeek: 150,
    source: WHO_2020_PL,
  },
  adult_medium: {
    id: 'adult_medium',
    title: 'Mały krok: jeden dzień ruchu więcej',
    body: 'Dobrze Ci idzie. Spróbuj ruszać się przez 5 dni w tygodniu po 30 minut — to razem 150 minut umiarkowanej aktywności.',
    minutesPerWeek: 150,
    source: PACJENT,
  },
  adult_high: {
    id: 'adult_high',
    title: 'Utrzymaj rytm',
    body: 'Ruszasz się regularnie — tak trzymaj. Zalecenia mówią o 150–300 minutach umiarkowanego ruchu w tygodniu. Pamiętaj też o ćwiczeniach wzmacniających mięśnie co najmniej 2 dni w tygodniu.',
    minutesPerWeek: 300,
    source: WHO_2020_PL,
  },
  senior: {
    id: 'senior',
    title: 'Równowaga i siła',
    body: 'Po 65. roku życia warto dodać ćwiczenia na równowagę i wzmacniające mięśnie co najmniej 3 dni w tygodniu. Zalecany cel to 150 minut umiarkowanego ruchu w tygodniu.',
    minutesPerWeek: 150,
    source: WHO_2020_PL,
  },
  senior_low: {
    id: 'senior_low',
    title: 'Mały krok: spokojny start',
    body: 'Każda aktywność jest lepsza niż żadna. Zacznij od krótkiego spaceru i stopniowo go wydłużaj. Z czasem dodaj proste ćwiczenia na równowagę i siłę.',
    minutesPerWeek: 150,
    source: WHO_2020_PL,
  },
};

const SENIOR_AGE = 65;
const ADULT_AGE = 18;

/** One "small step" tip for the profile, or null when adult guidelines don't apply (< 18). */
export function activityTip(profile: Profile, today: ISODate): ActivityTip | null {
  const age = ageAt(profile.birthYear, today);
  if (age < ADULT_AGE) return null;
  if (age >= SENIOR_AGE) {
    return profile.activity === 'low' ? ACTIVITY_TIPS.senior_low : ACTIVITY_TIPS.senior;
  }
  switch (profile.activity) {
    case 'low':
      return ACTIVITY_TIPS.adult_low;
    case 'medium':
      return ACTIVITY_TIPS.adult_medium;
    case 'high':
      return ACTIVITY_TIPS.adult_high;
    default:
      return ACTIVITY_TIPS.adult_general;
  }
}
