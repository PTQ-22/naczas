import { rules } from '@naczas/rules';

// examId → exact NFZ benefit names, from packages/rules/data/exams.json. Only booking 'queue'
// exams have NFZ queues; the rest (program, walk_in) are unknown to this API → 400.
const benefitsById = new Map(
  rules.flatMap((rule) =>
    rule.booking === 'queue' && rule.nfzBenefits?.length ? [[rule.id, rule.nfzBenefits]] : [],
  ),
);

export function benefitsForExam(examId: string): readonly string[] | undefined {
  return benefitsById.get(examId);
}

/** Every NFZ benefit the API serves (snapshot script). */
export const allNfzBenefits: readonly string[] = [...new Set([...benefitsById.values()].flat())];
