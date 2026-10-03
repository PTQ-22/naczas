import type { ExamRule, ISODate, Profile } from '@naczas/shared';

import { ageAt } from './age';
import { rules } from './load-rules';

type Factor = NonNullable<NonNullable<ExamRule['modifiers']>[number]['when']>;
type Modifier = NonNullable<ExamRule['modifiers']>[number];

const SMOKER_PACK_YEARS = 20;

/** Everything a rule's `requiresAny` / `modifiers[].when` can match against. */
export function profileFactors(profile: Profile): Set<Factor> {
  const factors = new Set<Factor>([...profile.conditions, ...profile.familyHistory]);
  // Former smokers count too: the LDCT program accepts up to 15 years of abstinence, which we
  // can't check, so the rule description tells the user instead of silently excluding them.
  if (profile.smoking.status !== 'never' && (profile.smoking.packYears ?? 0) >= SMOKER_PACK_YEARS) {
    factors.add('smoker_20py');
  }
  if (profile.activity === 'low') factors.add('low_activity');
  return factors;
}

const inRange = (age: number, [from, to]: readonly [number, number]) => age >= from && age <= to;

/**
 * Modifiers whose trigger matches the profile (ignoring the modifier's own age range).
 * A modifier without `when` always matches — it is selected by age alone.
 */
export function matchingModifiers(rule: ExamRule, profile: Profile): Modifier[] {
  const factors = profileFactors(profile);
  return (rule.modifiers ?? []).filter((m) => m.when === undefined || factors.has(m.when));
}

export function isEligible(rule: ExamRule, profile: Profile, today: ISODate): boolean {
  const { sex, age: range, requiresAny } = rule.eligibility;
  if (sex && sex !== profile.sex) return false;

  if (requiresAny?.length) {
    const factors = profileFactors(profile);
    if (!requiresAny.some((f) => factors.has(f))) return false;
  }

  if (!range) return true;
  const age = ageAt(profile.birthYear, today);
  if (inRange(age, range)) return true;
  // A triggered modifier with its own age range widens eligibility (e.g. colonoscopy from 40).
  // Age-only modifiers (no `when`) only change the interval; widening there would just be a
  // wider base range, so they are not allowed to grant eligibility.
  return matchingModifiers(rule, profile).some(
    (m) => m.when !== undefined && m.age !== undefined && inRange(age, m.age),
  );
}

export function eligibleExams(profile: Profile, today: ISODate): ExamRule[] {
  return rules.filter((rule) => isEligible(rule, profile, today));
}
