import { z } from 'zod';

import { ExamRuleSchema, type ExamRule } from '@naczas/shared';

import rawRules from '../data/exams.json';

const RulesSchema = z.array(ExamRuleSchema).superRefine((list, ctx) => {
  const seen = new Set<string>();
  list.forEach((rule, i) => {
    if (seen.has(rule.id)) {
      ctx.addIssue({ code: 'custom', path: [i, 'id'], message: `duplicate id ${rule.id}` });
    }
    seen.add(rule.id);
    if (rule.booking === 'queue' && !rule.nfzBenefits?.length) {
      ctx.addIssue({ code: 'custom', path: [i], message: 'queue rule needs nfzBenefits' });
    }
    if (rule.booking === 'program' && !rule.programUrl) {
      ctx.addIssue({ code: 'custom', path: [i], message: 'program rule needs programUrl' });
    }
  });
});

/** Parses rule data; throws on any invalid entry so bad data never reaches the plan. */
export function parseRules(data: unknown): ExamRule[] {
  return RulesSchema.parse(data);
}

// Parsed at import time on purpose: a broken exams.json should crash at startup, not mid-demo.
export const rules: readonly ExamRule[] = parseRules(rawRules);

const byId = new Map(rules.map((r) => [r.id, r]));

export function getExamRule(id: string): ExamRule {
  const rule = byId.get(id);
  if (!rule) throw new Error(`Unknown exam id: ${id}`);
  return rule;
}
