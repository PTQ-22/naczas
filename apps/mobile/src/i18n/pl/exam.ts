export const exam = {
  title: 'Badanie',
  bookTitle: 'Umów termin',
  // Verbatim from docs/research/exam-content.md §Disclaimery (examCard) — do not reword.
  disclaimer:
    'To informacja edukacyjna na podstawie programów NFZ i Ministerstwa Zdrowia — o tym, co jest dla Ciebie najlepsze, zdecyduj razem z lekarzem.',
  notFound: {
    title: 'Nie znaleziono badania',
    body: 'To badanie nie jest już dostępne w aplikacji.',
  },
  dueBy: 'Zrób do: {{date}}',
  bookedFor: 'Wizyta: {{date}}',
  doneNext: 'Następne: ok. {{date}}',
  startNow: 'Zacznij szukać: teraz',
  startFrom: 'Zacznij szukać: od {{date}}',
  queue: {
    radius: 'W promieniu {{km}} km czeka się',
    weeks: 'ok. {{weeks}} tyg.',
    asOf: 'Dane NFZ, stan na {{date}}',
    noData: 'Nie mamy aktualnych danych o kolejce — zacznij szukać terminu z wyprzedzeniem.',
  },
  section: {
    about: 'O badaniu',
    why: 'Dlaczego',
    frequency: 'Jak często',
    referral: 'Skierowanie',
    prep: 'Jak się przygotować',
  },
  frequency: {
    months: 'Co {{count}} miesięcy',
    oneYear: 'Co rok',
    years: 'Co {{count}} lata',
    yearsMany: 'Co {{count}} lat',
  },
  approximate: 'Wartość orientacyjna',
  referral: {
    required: 'Potrzebne — od lekarza rodzinnego.',
    notRequired: 'Nie jest potrzebne.',
    prepareRequest: 'Przygotuj prośbę do lekarza',
  },
  source: 'Źródło: {{name}}',
  sourceA11y: 'Źródło: {{name}}, otwiera przeglądarkę',
  cta: {
    findSlot: 'Znajdź termin w okolicy',
    program: 'Gdzie zrobić bez skierowania',
    markDone: 'Oznacz jako zrobione',
    done: 'Zrobione',
    booked: 'Umówiłem/am się',
    changeDate: 'Zmień datę wizyty',
    doneEarlier: 'Zrobione wcześniej? Zmień datę',
  },
} as const;
