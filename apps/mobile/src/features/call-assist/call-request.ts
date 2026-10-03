import type { CallAssistRequest, ExamRule, ISODate, Profile } from '@naczas/shared';

import { t } from '@/i18n';

/**
 * Genitive of a Polish first name for "w imieniu Kasi". Covers the common patterns
 * (Kasia→Kasi, Julia→Julii, Anna→Anny, Ola→Oli, Maja→Mai, Piotr→Piotra, Marek→Marka, Paweł→Pawła);
 * anything else is returned as typed — still understandable when spoken.
 */
export function polishGenitive(input: string): string {
  const name = input.trim().split(/\s+/)[0] ?? '';
  if (name.length < 2) return name;
  const lower = name.toLowerCase();
  if (lower.endsWith('ia')) {
    return /[szcnś]ia$/.test(lower) ? name.slice(0, -1) : `${name.slice(0, -1)}i`;
  }
  if (lower.endsWith('ja')) return `${name.slice(0, -2)}i`;
  if (/[kgl]a$/.test(lower)) return `${name.slice(0, -1)}i`;
  if (lower.endsWith('a')) return `${name.slice(0, -1)}y`;
  if (lower.endsWith('ek')) return `${name.slice(0, -2)}ka`;
  if (lower.endsWith('eł')) return `${name.slice(0, -2)}ła`;
  if (/[bcdfghjklłmnprstwzż]$/.test(lower)) return `${name}a`;
  return name;
}

/** "Kolonoskopia przesiewowa" → "kolonoskopia przesiewowa"; keeps "Moje Zdrowie", "USG", "HPV". */
export function inSentence(examName: string): string {
  return /^\p{Lu}\p{Lu}/u.test(examName)
    ? examName
    : examName.charAt(0).toLowerCase() + examName.slice(1);
}

/**
 * Everything the agent will say about the patient — deliberately no surname, PESEL or birth
 * year (AGENTS.md §8). The caregiver is the "self" profile; without one we say "rodziny".
 */
export function buildCallRequest({
  patient,
  profiles,
  rule,
  facilityName,
  bookBy,
}: {
  patient: Profile;
  profiles: readonly Profile[];
  rule: ExamRule;
  facilityName: string;
  bookBy?: ISODate | undefined;
}): CallAssistRequest {
  const caller =
    patient.relation === 'self' ? patient : profiles.find((p) => p.relation === 'self');
  return {
    examName: inSentence(rule.name),
    facilityName,
    forWhom: t(`callAssist.forWhom.${patient.relation}.${patient.sex}`),
    callerName: caller ? polishGenitive(caller.name) : t('callAssist.callerFallback'),
    ...(bookBy && { bookBy }),
  };
}
