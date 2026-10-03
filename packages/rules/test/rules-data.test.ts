import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { ExamRuleSchema } from '@naczas/shared';

import rawRules from '../data/exams.json';
import { getExamRule, parseRules, rules } from '../src';

const isHttps = (url: string) => /^https:\/\/\S+$/.test(url);

describe('data/exams.json', () => {
  it('every rule parses through the shared Zod schema', () => {
    expect(() => z.array(ExamRuleSchema).parse(rawRules)).not.toThrow();
  });

  it('has 8–12 rules with unique ids', () => {
    expect(rules.length).toBeGreaterThanOrEqual(8);
    expect(rules.length).toBeLessThanOrEqual(12);
    const ids = rules.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(rules.map((r) => [r.id, r] as const))('%s has a source and verifiedAt', (_, rule) => {
    expect(rule.source.name.trim()).not.toBe('');
    expect(isHttps(rule.source.url)).toBe(true);
    expect(rule.verifiedAt).toBeDefined();
  });

  it.each(rules.filter((r) => r.booking === 'queue').map((r) => [r.id, r] as const))(
    '%s (queue) has non-empty nfzBenefits',
    (_, rule) => {
      expect(rule.nfzBenefits?.length).toBeGreaterThan(0);
    },
  );

  it.each(rules.filter((r) => r.booking === 'program').map((r) => [r.id, r] as const))(
    '%s (program) has an https programUrl',
    (_, rule) => {
      expect(isHttps(rule.programUrl ?? '')).toBe(true);
    },
  );

  it.each(rules.map((r) => [r.id, r] as const))('%s has sane ages and interval', (_, rule) => {
    expect(rule.intervalMonths).toBeGreaterThan(0);
    const ranges = [rule.eligibility.age, ...(rule.modifiers ?? []).map((m) => m.age)];
    for (const range of ranges) {
      if (range) expect(range[0]).toBeLessThanOrEqual(range[1]);
    }
  });

  it.each(rules.map((r) => [r.id, r] as const))('%s has non-empty PL texts', (_, rule) => {
    expect(rule.name.trim()).not.toBe('');
    expect(rule.shortReason.trim()).not.toBe('');
    expect(rule.description.trim()).not.toBe('');
  });
});

describe('parseRules', () => {
  it('fails fast on invalid data', () => {
    expect(() => parseRules([{ id: 'broken' }])).toThrow();
  });

  it('rejects duplicate ids', () => {
    const [first] = rules;
    expect(() => parseRules([first, first])).toThrow(/duplicate/i);
  });

  it('rejects a queue rule without nfzBenefits', () => {
    const rule = { ...getExamRule('dental_checkup'), nfzBenefits: [] };
    expect(() => parseRules([rule])).toThrow(/nfzBenefits/);
  });

  it('rejects a program rule without programUrl', () => {
    const { programUrl: _omit, ...rule } = getExamRule('mammography');
    expect(() => parseRules([rule])).toThrow(/programUrl/);
  });
});

describe('getExamRule', () => {
  it('returns the rule by id', () => {
    expect(getExamRule('mammography').id).toBe('mammography');
  });

  it('throws for an unknown id', () => {
    expect(() => getExamRule('nope')).toThrow(/unknown exam/i);
  });
});
