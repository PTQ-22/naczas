export const facilities = {
  title: 'Placówki NFZ',
  heading: '{{exam}} — gdzie na NFZ',
  headingFallback: 'Gdzie na NFZ',
  // "pokazano: N" avoids Polish numeral declension (2 placówki / 5 placówek). N is the API limit,
  // not the number of facilities that exist; the distance is the farthest one shown.
  summary: {
    soonest: 'Pokazano: {{count}}, od najkrótszego czekania · do {{km}} km od Ciebie',
    nearest: 'Pokazano: {{count}}, od najbliższej · do {{km}} km od Ciebie',
  },
  snapshotInfo: 'Dane z kopii NFZ, stan na {{date}}.',
  // Exams with both an NFZ queue and a screening programme (colonoscopy): ITL queues are clinics.
  programInfo:
    'To kolejki NFZ do poradni. W programie przesiewowym zapiszesz się bez skierowania — placówki programu znajdziesz w wyszukiwarce NFZ.',
  programLink: 'Wyszukiwarka programów NFZ',
  programLinkA11y: 'Wyszukiwarka programów profilaktycznych NFZ, otwiera przeglądarkę',
  sort: {
    label: 'Sortowanie',
    soonest: 'Najszybciej',
    nearest: 'Najbliżej',
  },
  view: {
    label: 'Widok',
    list: 'Lista',
    map: 'Mapa',
  },
  wait: {
    // "tyg." avoids declension (1 tydzień / 2 tygodnie / 5 tygodni).
    weeks: 'ok. {{weeks}} tyg.',
    unknown: 'Brak danych o terminie',
    a11yWeeks: 'średnio około {{weeks}} tyg. oczekiwania',
    a11yUnknown: 'brak danych o czasie oczekiwania',
  },
  distance: '{{km}} km',
  accessibility: {
    elevator: 'winda',
    ramp: 'podjazd',
    parking: 'parking',
    toilet: 'toaleta',
  },
  card: {
    a11y: '{{name}}, {{wait}}, {{distance}}',
  },
  actions: {
    call: 'Zadzwoń',
    callA11y: 'Zadzwoń do: {{name}}',
    navigate: 'Nawiguj',
    navigateA11y: 'Nawiguj do: {{name}}, otwiera mapy',
    booked: 'Umówiłem/am się',
    bookedA11y: 'Umówiłem/am się w: {{name}}, zapisz datę wizyty',
  },
  map: {
    a11y: 'Mapa placówek. Te same placówki są na liście.',
    you: 'Twoja okolica',
    // Marker label for the user's (rounded) position.
    youShort: 'Ty',
    attribution: '© OpenStreetMap',
  },
  states: {
    errorTitle: 'Nie udało się pobrać placówek',
    errorBody: 'Sprawdź połączenie z internetem.',
    retry: 'Spróbuj ponownie',
    emptyTitle: 'Brak placówek z tym badaniem w Twoim województwie',
    noLocationTitle: 'Brak lokalizacji w profilu',
    noLocationBody: 'Dodaj miejscowość w profilu, żeby zobaczyć placówki w okolicy.',
    noQueueTitle: 'To badanie nie ma kolejki NFZ',
    loading: 'Wczytuję placówki…',
  },
} as const;
