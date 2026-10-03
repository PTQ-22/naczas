import type { LastDoneAnswer } from '@naczas/shared';

import { pluralForm } from '@/features/plan/plan-view-model';
import { t } from '@/i18n';

/**
 * Months → years as spoken: whole ("5") or with a half ("2,5"), from a year up. Below a year,
 * or for other fractions, null — the label stays in months ("6 miesięcy").
 */
function inYears(months: number): { text: string; whole: boolean } | null {
  if (months < 12 || months % 6 !== 0) return null;
  const whole = months % 12 === 0;
  return { text: String(months / 12).replace('.', ','), whole };
}

/** Polish fractions take the genitive singular ("2,5 roku"), whole numbers the usual plural. */
const yearsForm = (y: { text: string; whole: boolean }) =>
  y.whole ? pluralForm(Number(y.text)) : 'fraction';

/** Upper ends of ranges are never 1, so 'one' reads like 'many' there. */
const rangeForm = (n: number) => (pluralForm(n) === 'few' ? 'few' : 'many');

/**
 * Chip label for a "Kiedy ostatnio?" answer, in the exam's own interval: for colonoscopy
 * (120 mo.) "W ciągu ostatnich 5 lat" / "5–10 lat temu" / "Ponad 10 lat temu"; for Moje Zdrowie
 * after 50 (36 mo.) "W ciągu ostatnich półtora roku" / "1,5–3 lata temu" / "Ponad 3 lata temu".
 */
export function lastDoneLabel(answer: LastDoneAnswer, intervalMonths: number): string {
  const full = intervalMonths;
  const half = intervalMonths / 2;
  switch (answer) {
    case 'within_half_interval': {
      if (half === 12) return t('onboarding.steps.lastExams.answers.withinHalf.oneYear');
      if (half === 18) return t('onboarding.steps.lastExams.answers.withinHalf.oneAndHalfYears');
      const y = inYears(half);
      if (!y) return t('onboarding.steps.lastExams.answers.withinHalf.months', { n: half });
      return y.whole
        ? t('onboarding.steps.lastExams.answers.withinHalf.years', { n: y.text })
        : t('onboarding.steps.lastExams.answers.withinHalf.fractionYears', { n: y.text });
    }
    case 'within_interval': {
      const from = inYears(half);
      const to = inYears(full);
      if (from && to) {
        const form = to.whole ? rangeForm(Number(to.text)) : 'fraction';
        return t(`onboarding.steps.lastExams.answers.withinInterval.years.${form}`, {
          from: from.text,
          to: to.text,
        });
      }
      return t(`onboarding.steps.lastExams.answers.withinInterval.months.${rangeForm(full)}`, {
        from: half,
        to: full,
      });
    }
    case 'over_interval': {
      const y = inYears(full);
      return y
        ? t(`onboarding.steps.lastExams.answers.overInterval.years.${yearsForm(y)}`, { n: y.text })
        : t(`onboarding.steps.lastExams.answers.overInterval.months.${rangeForm(full)}`, {
            n: full,
          });
    }
    case 'never':
      return t('onboarding.steps.lastExams.answers.never');
    case 'unknown':
      return t('onboarding.steps.lastExams.answers.unknown');
  }
}
