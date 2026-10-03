import type { VisitPrepSummary } from '@naczas/rules';
import type { ISODate } from '@naczas/shared';

import { t } from '@/i18n';
import { colors, typography } from '@/theme';

import { formatDatePl } from './format-date';

const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

/** Profile name and other free text come from the user, so everything is escaped. */
export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (ch) => HTML_ESCAPES[ch] ?? ch);
}

const list = (items: string[], empty: string) =>
  items.length
    ? `<ul>${items.map((i) => `<li>${i}</li>`).join('')}</ul>`
    : `<p class="muted">${escapeHtml(empty)}</p>`;

const section = (title: string, body: string) =>
  `<section><h2>${escapeHtml(title)}</h2>${body}</section>`;

/**
 * Print-friendly A4 HTML for expo-print. Only the first name identifies the person
 * (no birth year, location or contact data). Always light colours — it is meant for paper.
 */
export function buildVisitPrepHtml(summary: VisitPrepSummary, today: ISODate): string {
  const c = colors.light;
  const type = typography.normal;
  const { person } = summary;
  const e = escapeHtml;

  const body = [
    `<h1>${e(t('visitPrep.pdf.title'))}</h1>`,
    `<p class="person">${e(
      t('visitPrep.person.summary', { name: person.name, age: person.age, sex: person.sexLabel }),
    )}</p>`,
    `<p class="muted">${e(t('visitPrep.pdf.generatedAt', { date: formatDatePl(today) }))}</p>`,
    section(
      t('visitPrep.sections.riskFactors'),
      list(summary.riskFactors.map(e), t('visitPrep.empty.riskFactors')),
    ),
    section(
      t('visitPrep.sections.askForReferral'),
      list(
        summary.askForReferral.map((x) => `<strong>${e(x.name)}</strong> — ${e(x.reason)}`),
        t('visitPrep.empty.askForReferral'),
      ),
    ),
    section(
      t('visitPrep.sections.noReferralNeeded'),
      list(
        summary.noReferralNeeded.map(
          (x) => `<strong>${e(x.name)}</strong>${x.referralNote ? ` — ${e(x.referralNote)}` : ''}`,
        ),
        t('visitPrep.empty.noReferralNeeded'),
      ),
    ),
    section(
      t('visitPrep.sections.recentlyDone'),
      list(
        summary.recentlyDone.map(
          (x) =>
            `<strong>${e(x.name)}</strong> — ${e(t('visitPrep.doneOn', { date: formatDatePl(x.date) }))}`,
        ),
        t('visitPrep.empty.recentlyDone'),
      ),
    ),
    // Last section + disclaimer stay together, so the disclaimer never sits alone on page 2 (P2).
    `<div class="closing">${section(
      t('visitPrep.sections.questions'),
      summary.questions.length
        ? `<ol>${summary.questions.map((q) => `<li>${e(q)}</li>`).join('')}</ol>`
        : '',
    )}<p class="disclaimer">${e(t('visitPrep.pdf.disclaimer'))}</p></div>`,
  ].join('\n');

  return `<!doctype html>
<html lang="pl">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${e(t('visitPrep.pdf.title'))}</title>
<style>
  @page { size: A4; margin: 18mm; }
  body { font-family: -apple-system, Roboto, "Segoe UI", Helvetica, Arial, sans-serif;
    color: ${c.text}; background: ${c.surface}; font-size: ${type.body.fontSize}px;
    line-height: ${type.body.lineHeight}px; }
  h1 { font-size: ${type.title.fontSize}px; line-height: ${type.title.lineHeight}px; margin: 0 0 8px; }
  h2 { font-size: ${type.heading.fontSize}px; line-height: ${type.heading.lineHeight}px;
    margin: 0 0 6px; border-bottom: 1px solid ${c.border}; padding-bottom: 4px; }
  section { margin-top: 14px; break-inside: avoid; page-break-inside: avoid; }
  .closing { break-inside: avoid; page-break-inside: avoid; }
  ul, ol { margin: 0; padding-left: 22px; }
  li { margin-bottom: 4px; }
  .person { font-size: ${type.bodyLarge.fontSize}px; font-weight: 600; margin: 0 0 4px; }
  .muted { color: ${c.textMuted}; margin: 0; }
  .disclaimer { margin-top: 12px; break-before: avoid; page-break-before: avoid; color: ${c.textMuted}; font-size: ${type.caption.fontSize}px; }
</style>
</head>
<body>
${body}
</body>
</html>`;
}
