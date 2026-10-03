import { createT } from '../t';

const dict = {
  common: { tabs: { plan: 'Plan' }, greeting: 'Cześć, {{name}}!' },
  plan: { title: 'Twój plan' },
} as const;

const t = createT(dict);

describe('t()', () => {
  it('resolves nested keys', () => {
    expect(t('plan.title')).toBe('Twój plan');
    expect(t('common.tabs.plan')).toBe('Plan');
  });

  it('interpolates {{params}}', () => {
    expect(t('common.greeting', { name: 'Kasia' })).toBe('Cześć, Kasia!');
  });

  it('leaves unknown placeholders untouched', () => {
    expect(t('common.greeting')).toBe('Cześć, {{name}}!');
  });

  it('rejects unknown keys at compile time', () => {
    // @ts-expect-error — key does not exist in the dictionary; t() must be type-safe
    expect(t('plan.missing')).toBe('plan.missing');
  });
});
