import type { ISODate, Profile } from '@naczas/shared';

import {
  useOnboardingDraftStore,
  useProfilesStore,
  useRecordsStore,
  useDefaultFacilityStore,
  type OnboardingDraft,
} from '@/store';

import { draftToProfile, draftToRecords } from './survey';

export function createProfileId(now: number = Date.now(), random: number = Math.random()): string {
  return `p-${now.toString(36)}-${Math.floor(random * 36 ** 4).toString(36)}`;
}

/**
 * Saves the finished survey as a profile + exam records, makes it the active profile and
 * drops the draft. Returns the new profile, or null if steps 1–2 are incomplete.
 */
export function completeOnboarding(
  draft: OnboardingDraft,
  options: { today: ISODate; selfName: string; id?: string },
): Profile | null {
  const profile = draftToProfile(draft, {
    id: options.id ?? createProfileId(),
    today: options.today,
    selfName: options.selfName,
  });
  if (!profile) return null;

  useProfilesStore.getState().addProfile(profile);
  useProfilesStore.getState().setActiveProfile(profile.id);
  const { upsertRecord } = useRecordsStore.getState();
  draftToRecords(draft, profile, options.today).forEach(upsertRecord);
  useOnboardingDraftStore.getState().clear();

  if (profile.location) {
    useDefaultFacilityStore.getState().setDefault(profile.id, {
      id: `default-${profile.id}`,
      benefit: 'PORADNIA PODSTAWOWEJ OPIEKI ZDROWOTNEJ',
      providerName: 'Twoja Przychodnia',
      placeName: 'Poradnia Ogólna',
      address: 'ul. Zdrowotna 1',
      locality: profile.location.label || 'Twoja miejscowość',
      phone: '111 222 333',
      lat: profile.location.lat,
      lng: profile.location.lng,
      distanceKm: 0,
      firstAvailableDate: null,
      waitDays: 0,
      awaiting: 0,
      anesthesia: null,
      accessibility: { ramp: true, elevator: true, parking: true, toilet: true },
      asOf: options.today,
    });
  }

  return profile;
}
