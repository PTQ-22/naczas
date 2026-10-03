import type { ISODate, Profile } from '@naczas/shared';

import {
  useOnboardingDraftStore,
  useProfilesStore,
  useRecordsStore,
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
  return profile;
}
