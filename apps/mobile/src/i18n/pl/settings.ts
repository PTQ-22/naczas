export const settings = {
  title: 'Ustawienia',
  display: {
    header: 'Wygląd',
    seniorMode: 'Tryb senior (większy tekst)',
    seniorModeHint: 'Powiększa tekst i przyciski w całej aplikacji.',
    darkMode: 'Motyw',
    darkModeOptions: {
      system: 'Jak w systemie',
      light: 'Jasny',
      dark: 'Ciemny',
    },
  },
  location: {
    header: 'Lokalizacja',
    current: 'Obecnie: {{label}}',
    none: 'Nie ustawiono',
    change: 'Zmień lokalizację',
  },
  demo: {
    header: 'Tryb demo',
    todayOverride: 'Data demo',
    todayOverrideHint: 'Przewiń czas, żeby zobaczyć, jak zmienia się plan i przypomnienia.',
    todayOverrideOff: 'Wyłączona (dzisiejsza data)',
    clearOverride: 'Wróć do dzisiejszej daty',
    testNotification: 'Wyślij testowe powiadomienie teraz',
  },
  data: {
    header: 'Dane',
    reset: 'Usuń wszystkie dane',
    resetConfirmTitle: 'Usunąć wszystkie dane?',
    resetConfirmBody: 'Profile, plany i historia badań zostaną usunięte z tego urządzenia.',
    resetConfirm: 'Usuń',
    cancel: 'Anuluj',
  },
  restoreFailed: 'Nie udało się odczytać zapisanych danych, więc zaczynamy od nowa.',
  dismiss: 'Zamknij',
  disclaimer:
    'NaCzas przypomina i edukuje — nie stawia diagnozy i nie zastępuje konsultacji z lekarzem.',
} as const;
