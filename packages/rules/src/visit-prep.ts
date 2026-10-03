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
  chronic_kidney_disease: 'Przewlekła choroba nerek',
  familial_hypercholesterolemia: 'Rodzinna hipercholesterolemia',
  heart_disease: 'Choroba serca lub naczyń',
  copd: 'POChP',
  immunosuppression: 'Zakażenie HIV lub leki immunosupresyjne',
};

const FAMILY_LABEL: Record<FamilyHistory, string> = {
  colorectal_cancer: 'Rak jelita grubego w rodzinie',
  breast_cancer: 'Rak piersi w rodzinie',
  ovarian_cancer: 'Rak jajnika w rodzinie',
  endometrial_cancer: 'Rak trzonu macicy w rodzinie',
};

/** Genitive for "ze względu na … w rodzinie". */
const FAMILY_GENITIVE: Record<FamilyHistory, string> = {
  colorectal_cancer: 'raka jelita grubego',
  breast_cancer: 'raka piersi',
  ovarian_cancer: 'raka jajnika',
  endometrial_cancer: 'raka trzonu macicy',
};

const MAX_QUESTIONS = 4;
const MIN_QUESTIONS = 2;

function riskFactors(profile: Profile): string[] {
  const out = [
    ...profile.conditions.map((c) => CONDITION_LABEL[c]),
    ...profile.familyHistory.map((f) => FAMILY_LABEL[f]),
  ];
  const { status, packYears, quitOver15y, otherLungRisk } = profile.smoking;
  if (status !== 'never') {
    const base = status === 'current' ? 'Palenie tytoniu obecnie' : 'Palenie tytoniu w przeszłości';
    const details = [
      // "paczkolata: N" avoids Polish numeral declension (1 paczkorok / 2 paczkolata / 5 paczkolat).
      ...(packYears === undefined ? [] : [`paczkolata: ${packYears}`]),
      ...(quitOver15y === undefined
        ? []
        : [quitOver15y ? 'rzucone ponad 15 lat temu' : 'rzucone w ciągu ostatnich 15 lat']),
    ];
    out.push(details.length ? `${base} (${details.join(', ')})` : base);
    if (otherLungRisk) out.push('Dodatkowy czynnik ryzyka raka płuca');
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
  // pacjent.gov.pl: these cancers in the family are what the NFZ "opieka nad rodzinami wysokiego,
  // dziedzicznie uwarunkowanego ryzyka" covers; the GP decides on the referral.
  const hereditary = profile.familyHistory.map((f) => FAMILY_GENITIVE[f]);
  if (hereditary.length) {
    const last = hereditary.pop();
    const list = hereditary.length ? `${hereditary.join(', ')} i ${last}` : last;
    out.push(
      `Czy ze względu na ${list} w rodzinie ${should} skorzystać z porady w poradni genetycznej?`,
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
      // Undated answers ('over_interval', …) have nothing to show the doctor.
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
