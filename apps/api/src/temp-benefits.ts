// TODO(WS1): replace with ExamRule.nfzBenefits from @naczas/rules once exams.json ships them.
// Temporary map so WS2 can serve endpoints before the rules engine exists. Names verified against
// NFZ /benefits in WS2-1 (2026-10-03); only `booking: 'queue'` exams have NFZ queues.
export const TEMP_NFZ_BENEFITS: Readonly<Record<string, readonly string[]>> = {
  colonoscopy_screening: ['KOLONOSKOPIA'],
  dental_checkup: ['PORADNIA STOMATOLOGICZNA'],
  eye_exam: ['ŚWIADCZENIA Z ZAKRESU OKULISTYKI'],
};

export function benefitsForExam(examId: string): readonly string[] | undefined {
  return Object.hasOwn(TEMP_NFZ_BENEFITS, examId) ? TEMP_NFZ_BENEFITS[examId] : undefined;
}
