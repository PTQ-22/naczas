export const common = {
  tabs: {
    plan: 'Plan',
    family: 'Rodzina',
    settings: 'Ustawienia',
  },
  // Shared base components (WS4-2).
  components: {
    loading: 'Ładowanie…',
    progress: 'Krok {{current}} z {{total}}',
    addProfile: 'Dodaj osobę',
    profileWithUrgent: '{{name}}, pilne badania: {{count}}',
    disclaimerMore: 'Więcej',
    disclaimerMoreHint: 'Otwiera pełną informację',
    expand: 'Rozwiń',
    collapse: 'Zwiń',
  },
  dev: {
    galleryTitle: 'Galeria komponentów',
    sample: 'Przykładowy tekst',
    sampleLong:
      'Dłuższy tekst, który musi się zawijać przy dużej czcionce systemowej i w trybie senior.',
    primary: 'Główna akcja',
    secondary: 'Akcja drugorzędna',
    ghost: 'Akcja tekstowa',
    senior: 'Tryb senior',
    dark: 'Ciemny motyw',
    emptyTitle: 'Wszystko na czas',
    emptyBody: 'Następne badanie: za 2 lata.',
    optionA: 'Rak piersi',
    optionB: 'Zawał lub udar przed 60. rokiem życia',
    disclaimer: 'Aplikacja przypomina, nie diagnozuje.',
    profileMe: 'Ja',
    profileMama: 'Mama',
  },
} as const;
