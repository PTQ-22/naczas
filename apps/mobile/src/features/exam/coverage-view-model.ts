import { format, parseISO } from 'date-fns';

import type { Coverage } from '@naczas/shared';

import { t } from '@/i18n';

export interface CoverageView {
  area: string;
  /** "31,2%" — Polish decimal comma */
  percent: string;
  body: string;
  asOf: string;
  a11y: string;
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function coverageView(c: Coverage): CoverageView {
  const number = c.percent.toLocaleString('pl-PL', { maximumFractionDigits: 1 }).replace('.', ',');
  // API names are nominative ("powiat bolesławiecki", "Warszawa") — sentence-case for a label.
  const area = capitalize(t(`exam.coverage.area.${c.level}`, { name: c.areaName }));
  const body = t(`exam.coverage.body.${c.program}`);
  return {
    area,
    percent: `${number}%`,
    body,
    asOf: t('exam.coverage.asOf', { date: format(parseISO(c.asOf), 'd.MM.yyyy') }),
    a11y: t('exam.coverage.a11y', { area, percent: number, body }),
  };
}
