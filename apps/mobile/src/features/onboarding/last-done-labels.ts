import type { LastDoneAnswer } from '@naczas/shared';

import { pluralForm } from '@/features/plan/plan-view-model';
import { t } from '@/i18n';

const isYears = (...months: number[]) => months.every((m) => m % 12 === 0);

/**
 * Chip label for a "Kiedy ostatnio?" answer, in the exam's own interval: for colonoscopy
 * (120 mo.) "W ciągu ostatnich 5 lat" / "5–10 lat temu" / "Ponad 10 lat temu"; for the dentist
 * (12 mo.) "W ciągu ostatnich 6 miesięcy" / "6–12 miesięcy temu" / "Ponad rok temu".
 */
export function lastDoneLabel(answer: LastDoneAnswer, intervalMonths: number): string {
  const full = intervalMonths;
  const half = intervalMonths / 2;
  switch (answer) {
    case 'within_half_interval':
      if (half === 12) return t('onboarding.steps.lastExams.answers.withinHalf.oneYear');
      return isYears(half)
        ? t('onboarding.steps.lastExams.answers.withinHalf.years', { n: half / 12 })
        : t('onboarding.steps.lastExams.answers.withinHalf.months', { n: half });
    case 'within_interval': {
      const years = isYears(half, full);
      const [from, to] = years ? [half / 12, full / 12] : [half, full];
      // 1 is never the upper end of a range, so 'one' can't happen; it reads like 'many'.
      const form = pluralForm(to) === 'few' ? 'few' : 'many';
      return years
        ? t(`onboarding.steps.lastExams.answers.withinInterval.years.${form}`, { from, to })
        : t(`onboarding.steps.lastExams.answers.withinInterval.months.${form}`, { from, to });
    }
    case 'over_interval': {
      if (isYears(full)) {
        const n = full / 12;
        return t(`onboarding.steps.lastExams.answers.overInterval.years.${pluralForm(n)}`, { n });
      }
      const form = pluralForm(full) === 'few' ? 'few' : 'many';
      return t(`onboarding.steps.lastExams.answers.overInterval.months.${form}`, { n: full });
    }
    case 'never':
      return t('onboarding.steps.lastExams.answers.never');
    case 'unknown':
      return t('onboarding.steps.lastExams.answers.unknown');
  }
}
