import {
  ISODateSchema,
  type Condition,
  type ExamRecord,
  type ExamRule,
  type FamilyHistory,
  type ISODate,
  type Plan,
  type Profile,
  type Sex,
} from '@naczas/shared';

import { ageAt } from './age';
import { rules } from './load-rules';

/** Local to packages/rules — data for the visit-prep screen and the PDF for the GP. */
export interface VisitPrepSummary {
  person: { name: string; age: number; sex: Sex; sexLabel: string };
  riskFactors: string[];
  askForReferral: Array<{ examId: string; name: string; reason: string }>;
  noReferralNeeded: Array<{ examId: string; name: string; referralNote?: string }>;
  recentlyDone: Array<{ examId: string; name: string; date: ISODate }>;
  questions: string[];
}

const SEX_LABEL: Record<Sex, string> = { female: 'kobieta', male: 'mężczyzna' };

const CONDITION_LABEL: Record<Condition, string> = {
  diabetes: 'Cukrzyca',
  hypertension: 'Nadciśnienie tętnicze',
  heart_disease: 'Choroba serca',
  other: 'Inna choroba przewlekła',
};

const FAMILY_LABEL: Record<FamilyHistory, string> = {
  breast_cancer: 'Rak piersi w rodzinie',
  colorectal_cancer: 'Rak jelita grubego w rodzinie',
  prostate_cancer: 'Rak prostaty w rodzinie',
  ovarian_cancer: 'Rak jajnika w rodzinie',
  early_cardiovascular: 'Zawał lub udar u bliskiego krewnego przed 60. rokiem życia',
};

const MAX_QUESTIONS = 4;
const MIN_QUESTIONS = 2;

function riskFactors(profile: Profile): string[] {
  const out = [
    ...profile.conditions.map((c) => CONDITION_LABEL[c]),
    ...profile.familyHistory.map((f) => FAMILY_LABEL[f]),
  ];
  const { status, packYears } = profile.smoking;
  if (status !== 'never') {
    const base = status === 'current' ? 'Palenie tytoniu obecnie' : 'Palenie tytoniu w przeszłości';
    // "paczkolata: N" avoids Polish numeral declension (1 paczkorok / 2 paczkolata / 5 paczkolat).
    out.push(packYears === undefined ? base : `${base} (paczkolata: ${packYears})`);
  }
  if (profile.activity === 'low') out.push('Niska aktywność fizyczna');
  return out;
}

function questions(input: {
  profile: Profile;
  urgent: ExamRule[];
  askForReferral: ExamRule[];
}): string[] {
  const { profile, urgent, askForReferral } = input;
  const should = profile.sex === 'female' ? 'powinnam' : 'powinienem';
  const family = new Set<string>(profile.familyHistory);
  const out: string[] = [];

  // Questions only ask; the doctor decides. No advice is generated here (AGENTS.md §7).
  const familyExam = urgent.find((r) => r.modifiers?.some((m) => m.when && family.has(m.when)));
  if (familyExam) {
    out.push(
      `Czy ze względu na historię rodzinną ${should} zrobić badanie „${familyExam.name}” wcześniej lub częściej?`,
    );
  }
  if (askForReferral.length) {
    out.push(`Czy możemy omówić skierowanie na: ${askForReferral.map((r) => r.name).join(', ')}?`);
  }
  if (urgent.length > 1) {
    out.push('Od którego z tych badań warto zacząć?');
  }
  out.push(`Czy są inne badania, o których ${should} pamiętać?`);
  if (out.length < MIN_QUESTIONS) out.push('Jak często warto powtarzać te badania?');
  return out.slice(0, MAX_QUESTIONS);
}

export function visitPrepSummary(input: {
  profile: Profile;
  plan: Plan;
  today: ISODate;
  /** Needed only for `recentlyDone` dates — the plan itself has no last-done date. */
  records?: ExamRecord[];
}): VisitPrepSummary {
  const { profile, plan, today, records = [] } = input;
  const byId = new Map(rules.map((r) => [r.id, r]));

  const urgent = plan.items
    .filter((i) => i.urgency === 'act_now' || i.urgency === 'this_year')
    .flatMap((i) => byId.get(i.examId) ?? []);
  const needsReferral = urgent.filter((r) => r.referral);

  const recentlyDone = records
    .filter((r) => r.profileId === profile.id && r.status === 'done')
    .flatMap((r) => {
      const rule = byId.get(r.examId);
      // Survey answers ('within_1y', …) have no date to show the doctor.
      const date = ISODateSchema.safeParse(r.lastDone);
      return rule && date.success ? [{ examId: rule.id, name: rule.name, date: date.data }] : [];
    })
    .sort((a, b) => b.date.localeCompare(a.date));

  return {
    person: {
      name: profile.name,
      age: ageAt(profile.birthYear, today),
      sex: profile.sex,
      sexLabel: SEX_LABEL[profile.sex],
    },
    riskFactors: riskFactors(profile),
    askForReferral: needsReferral.map((r) => ({
      examId: r.id,
      name: r.name,
      reason: r.shortReason,
    })),
    noReferralNeeded: urgent
      .filter((r) => !r.referral)
      .map((r) => ({ examId: r.id, name: r.name, referralNote: r.referralNote })),
    recentlyDone,
    questions: questions({ profile, urgent, askForReferral: needsReferral }),
  };
}
