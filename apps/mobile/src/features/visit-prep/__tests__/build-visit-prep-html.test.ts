import type { VisitPrepSummary } from '@naczas/rules';

import { buildVisitPrepHtml, escapeHtml } from '../build-visit-prep-html';

const summary: VisitPrepSummary = {
  person: { name: 'Ala <script>alert(1)</script>', age: 58, sex: 'female', sexLabel: 'kobieta' },
  riskFactors: ['Rak jelita grubego w rodzinie', 'Palenie & "inne"'],
  askForReferral: [{ examId: 'eye_exam', name: 'Badanie u okulisty', reason: 'Kontrola wzroku.' }],
  noReferralNeeded: [
    {
      examId: 'colonoscopy_screening',
      name: 'Kolonoskopia',
      referralNote: 'Nie potrzebujesz skierowania.',
    },
  ],
  recentlyDone: [{ examId: 'mammography', name: 'Mammografia', date: '2026-06-15' }],
  questions: ['Czy powinnam zrobić to wcześniej?', 'Od którego badania zacząć?'],
};

describe('escapeHtml', () => {
  it('escapes all HTML-significant characters', () => {
    expect(escapeHtml(`<a href="x">'&'</a>`)).toBe(
      '&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;',
    );
  });
});

describe('buildVisitPrepHtml', () => {
  const html = buildVisitPrepHtml(summary, '2026-10-03');

  it('contains every section heading', () => {
    for (const heading of [
      'Czynniki ryzyka',
      'Poproś lekarza o skierowanie na',
      'Możesz zapisać się bez skierowania',
      'Ostatnio zrobione',
      'Pytania do lekarza',
    ]) {
      expect(html).toContain(`<h2>${heading}</h2>`);
    }
  });

  it('contains the data, with Polish date format', () => {
    expect(html).toContain('Badanie u okulisty');
    expect(html).toContain('Nie potrzebujesz skierowania.');
    expect(html).toContain('zrobione 15.06.2026');
    expect(html).toContain('Przygotowano: 03.10.2026');
    expect(html).toContain('<li>Od którego badania zacząć?</li>');
  });

  it('escapes user-provided text (no script injection)', () => {
    expect(html).not.toContain('<script>');
    expect(html).toContain('Ala &lt;script&gt;alert(1)&lt;/script&gt;');
    expect(html).toContain('Palenie &amp; &quot;inne&quot;');
  });

  it('is an A4 print page with the disclaimer', () => {
    expect(html).toContain('@page { size: A4');
    expect(html).toContain('zdecyduj razem z lekarzem');
  });

  it('shows empty-state text for empty sections', () => {
    const empty = buildVisitPrepHtml(
      { ...summary, riskFactors: [], askForReferral: [], recentlyDone: [] },
      '2026-10-03',
    );
    expect(empty).toContain('Nie podano czynników ryzyka.');
    expect(empty).toContain('Żadne pilne badanie nie wymaga skierowania.');
    expect(empty).toContain('Brak zapisanych badań z datą.');
  });
});
