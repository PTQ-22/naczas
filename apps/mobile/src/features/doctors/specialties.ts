/**
 * What the doctors tab can search: one exam per distinct NFZ benefit (eye_exam/eye_check and
 * skin_check/dermatolog share a queue, so only one of each is listed). Independent of the plan —
 * the user may call any of them, recommended or not.
 */
export const SPECIALTY_EXAM_IDS = [
  'dental_checkup',
  'eye_check',
  'dermatolog',
  'endokrynolog',
  'neurolog',
  'colonoscopy_screening',
] as const;

export type SpecialtyExamId = (typeof SPECIALTY_EXAM_IDS)[number];
