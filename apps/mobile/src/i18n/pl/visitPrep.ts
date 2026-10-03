export const visitPrep = {
  title: 'Przygotowanie do wizyty',
  intro:
    'Zestawienie do omówienia z lekarzem rodzinnym. Możesz je pobrać jako PDF i pokazać na wizycie.',
  person: {
    // "wiek: N" instead of "N lat" — avoids Polish numeral declension (22 lata / 25 lat).
    summary: '{{name}} · wiek: {{age}} · {{sex}}',
    details: 'wiek: {{age}} · {{sex}}',
  },
  sections: {
    riskFactors: 'Czynniki ryzyka',
    askForReferral: 'Poproś lekarza o skierowanie na',
    noReferralNeeded: 'Możesz zapisać się bez skierowania',
    recentlyDone: 'Ostatnio zrobione',
    questions: 'Pytania do lekarza',
  },
  empty: {
    riskFactors: 'Nie podano czynników ryzyka.',
    askForReferral: 'Żadne pilne badanie nie wymaga skierowania.',
    noReferralNeeded: 'Brak pilnych badań bez skierowania.',
    recentlyDone: 'Brak zapisanych badań z datą.',
  },
  doneOn: 'zrobione {{date}}',
  share: {
    button: 'Pobierz PDF / Udostępnij',
    hint: 'Tworzy plik PDF z tym zestawieniem, który możesz zapisać lub wysłać.',
    error: 'Nie udało się przygotować PDF. Spróbuj ponownie.',
  },
  pdf: {
    title: 'Przygotowanie do wizyty u lekarza',
    generatedAt: 'Przygotowano: {{date}}',
    // Same wording as the exam-card disclaimer in docs/research/exam-content.md.
    disclaimer:
      'To informacja edukacyjna na podstawie programów NFZ i Ministerstwa Zdrowia — o tym, co jest dla Ciebie najlepsze, zdecyduj razem z lekarzem.',
  },
} as const;
