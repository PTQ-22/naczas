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
  notRecommended: 'To badanie nie jest teraz zalecane dla: {{name}}.',
  dueBy: 'Zrób do: {{date}}',
  bookedFor: 'Wizyta: {{date}}',
  doneNext: 'Następne: ok. {{date}}',
  startFrom: 'Zacznij szukać: od {{date}}',
  progress: {
    toBook: 'Do umówienia',
    booked: 'Umówione',
    done: 'Zrobione',
    a11y: 'Etap {{current}} z 3: {{label}}',
  },
  queue: {
    radius: 'W promieniu {{km}} km czeka się',
    asOf: 'Dane NFZ, stan na {{date}}',
    clinicNote:
      'To kolejki NFZ do poradni — w programie przesiewowym zapiszesz się bez skierowania.',
    programLink: 'Program przesiewowy bez skierowania',
    programLinkA11y: 'Program przesiewowy bez skierowania, otwiera wyszukiwarkę NFZ',
    noData: 'Nie mamy aktualnych danych o kolejce — zacznij szukać terminu z wyprzedzeniem.',
  },
  // Regional statistic from NFZ's programme reports — about the area, never about the person (§7).
  coverage: {
    title: 'W Twojej okolicy',
    area: {
      gmina: 'Gmina {{name}}',
      powiat: '{{name}}',
      voivodeship: 'Województwo {{name}}',
      country: 'Polska',
    },
    body: {
      mammography: 'uprawnionych kobiet jest objętych programem badań mammograficznych NFZ.',
      cervical: 'uprawnionych kobiet jest objętych programem badań szyjki macicy (test HPV) NFZ.',
      colonoscopy: 'uprawnionych osób jest objętych programem badań kolonoskopowych NFZ.',
    },
    a11y: '{{area}}: {{percent}} procent {{body}}',
    asOf: 'Dane NFZ, stan na {{date}}',
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
  resetInterval: 'Przywróć zalecany odstęp',
  referral: {
    required: 'Potrzebne — od lekarza rodzinnego.',
    notRequired: 'Nie jest potrzebne.',
    prepareRequest: 'Przygotuj prośbę do lekarza',
    prepareVisit: 'Przygotuj się do wizyty u lekarza',
  },
  source: 'Źródło: {{name}}',
  sourceA11y: 'Źródło: {{name}}, otwiera przeglądarkę',
  calendar: {
    add: 'Dodaj do kalendarza',
    addA11y: 'Dodaj przypomnienie o badaniu {{exam}} do kalendarza',
    searchTitle: 'Zacznij szukać terminu: {{exam}} ({{name}})',
    searchNotes:
      'Badanie warto zrobić do {{due}}. Na NFZ czeka się tygodniami — dziś dobry dzień, żeby poszukać terminu.\n\nPlacówki i kolejki w NaCzas: {{link}}',
    visitTitle: 'Wizyta: {{exam}} ({{name}})',
    visitNotes: 'Zapisane w NaCzas: {{link}}',
    saved: 'Dodano do kalendarza',
    downloaded: 'Pobrano plik kalendarza — otwórz go, żeby dodać przypomnienie.',
    denied: 'Brak dostępu do kalendarza — włącz go w Ustawieniach telefonu.',
    unavailable: 'Kalendarz nie jest dostępny w tej wersji aplikacji.',
  },
  toast: {
    markedDone: 'Oznaczono jako zrobione',
    undo: 'Cofnij',
    undoA11y: 'Cofnij oznaczenie badania {{name}} jako zrobione',
  },
  cta: {
    findSlot: 'Znajdź placówkę',
    program: 'Gdzie zrobić bez skierowania',
    markDone: 'Oznacz jako zrobione',
    done: 'Zrobione',
    booked: 'Umówiłem/am się',
    changeDate: 'Zmień datę wizyty',
    doneEarlier: 'Zrobione wcześniej? Zmień datę',
  },
  // "Umówiłem/am się" screen (exam/[examId]/book).
  book: {
    question: 'Kiedy masz wizytę?',
    dateLabel: 'Data wizyty',
    dateA11y: 'Data wizyty: {{date}}. Dotknij, aby zmienić.',
    facility: 'Placówka: {{name}}',
    reminder: 'Przypomnimy Ci o wizycie dzień wcześniej.',
    save: 'Zapisz wizytę',
    saveA11y: 'Zapisz wizytę na {{date}}',
    errors: {
      invalid: 'Wpisz poprawną datę.',
      past: 'Data wizyty nie może być w przeszłości.',
      tooFar: 'Wybierz datę w ciągu najbliższego roku.',
    },
    noProfile: 'Najpierw dodaj profil, żeby zapisać wizytę.',
  },
} as const;
