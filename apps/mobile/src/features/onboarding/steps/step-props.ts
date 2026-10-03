import type { ISODate } from '@naczas/shared';

import type { OnboardingDraft } from '@/store';

export interface StepProps {
  draft: OnboardingDraft;
  update: (patch: Partial<OnboardingDraft>) => void;
  today: ISODate;
}

/** Toggle for multi-select answers (conditions, family history). */
export function toggle<T>(list: readonly T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

/** Digits-only numeric input → number, or null when empty/invalid. */
export function parseWholeNumber(text: string): number | null {
  return /^\d+$/.test(text) ? Number(text) : null;
}
