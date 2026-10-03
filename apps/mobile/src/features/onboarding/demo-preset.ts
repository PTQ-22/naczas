import { addDays, format, parseISO, subMonths } from 'date-fns';

import type { ExamRecord, ISODate, Profile } from '@naczas/shared';

import { t } from '@/i18n';
import { postalCodeToLocation } from '@/services/postal';
import {
  deleteProfileWithData,
  useOnboardingDraftStore,
  useProfilesStore,
  useRecordsStore,
} from '@/store';

import { postalLocationLabel } from './location-label';

/** Fixed ids so loading the preset again replaces it instead of adding duplicates. */
export const DEMO_MAMA_ID = 'demo-mama';
export const DEMO_KASIA_ID = 'demo-kasia';

const toISO = (date: Date): ISODate => format(date, 'yyyy-MM-dd');

/**
 * Stage scenario (docs/01-user-journey.md §Demo), dated relative to `today` so it works with
 * any demo date: Mama 58 with colorectal cancer in the family → colonoscopy never done is the
 * one red card on top; mammography already booked in ~2 weeks. Kasia 34 → cervical screening
 * overdue, dentist recently. Answers are demo data, not medical values — the rules engine
 * decides intervals and urgency.
 */
export function buildDemoPreset(today: ISODate): { profiles: Profile[]; records: ExamRecord[] } {
  const now = parseISO(today);
  const year = now.getFullYear();
  const warsaw = postalCodeToLocation('00-950');
  const location = warsaw && {
    province: warsaw.province,
    lat: warsaw.lat,
    lng: warsaw.lng,
    label: postalLocationLabel(warsaw),
  };

  const base = { conditions: [], smoking: { status: 'never' as const }, createdAt: today };
  const mama: Profile = {
    ...base,
    id: DEMO_MAMA_ID,
    name: t('onboarding.demo.mamaName'),
    relation: 'parent',
    birthYear: year - 58,
    sex: 'female',
    familyHistory: ['colorectal_cancer'],
    activity: 'low',
    ...(location && { location }),
  };
  const kasia: Profile = {
    ...base,
    id: DEMO_KASIA_ID,
    name: t('onboarding.demo.kasiaName'),
    relation: 'self',
    birthYear: year - 34,
    sex: 'female',
    familyHistory: [],
    activity: 'medium',
    ...(location && { location }),
  };

  const record = (
    profileId: string,
    examId: string,
    fields: Pick<ExamRecord, 'status'> & Partial<ExamRecord>,
  ): ExamRecord => ({ profileId, examId, updatedAt: today, ...fields });

  const records: ExamRecord[] = [
    record(DEMO_MAMA_ID, 'colonoscopy_screening', { lastDone: 'never', status: 'none' }),
    record(DEMO_MAMA_ID, 'mammography', {
      lastDone: 'over_3y',
      status: 'booked',
      bookedFor: toISO(addDays(now, 14)),
    }),
    record(DEMO_MAMA_ID, 'health_check_adult', {
      lastDone: toISO(subMonths(now, 12)),
      status: 'done',
    }),
    // An exact date 14 months back is still "1–3 years ago" but, unlike the '1_3y' answer
    // (assumed 24 months), doesn't make the eye exam due today and red next to colonoscopy.
    record(DEMO_MAMA_ID, 'eye_exam', { lastDone: toISO(subMonths(now, 14)), status: 'none' }),
    // Recent answers for the rest so colonoscopy stands out instead of 5 red cards.
    record(DEMO_MAMA_ID, 'dental_checkup', { lastDone: 'within_1y', status: 'none' }),
    record(DEMO_MAMA_ID, 'cervical_screening', { lastDone: 'within_1y', status: 'none' }),
    record(DEMO_MAMA_ID, 'skin_check', { lastDone: 'within_1y', status: 'none' }),
    record(DEMO_KASIA_ID, 'cervical_screening', { lastDone: 'over_3y', status: 'none' }),
    record(DEMO_KASIA_ID, 'dental_checkup', { lastDone: 'within_1y', status: 'none' }),
  ];
  return { profiles: [mama, kasia], records };
}

/** „Wczytaj profil demo”: replaces earlier demo profiles, keeps the user's own, Mama active. */
export function loadDemoPreset(today: ISODate): Profile[] {
  const { profiles, records } = buildDemoPreset(today);
  profiles.forEach((p) => deleteProfileWithData(p.id));
  const { addProfile, setActiveProfile } = useProfilesStore.getState();
  profiles.forEach(addProfile);
  records.forEach(useRecordsStore.getState().upsertRecord);
  setActiveProfile(DEMO_MAMA_ID);
  useOnboardingDraftStore.getState().clear();
  return profiles;
}
