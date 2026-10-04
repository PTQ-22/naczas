export const agent = {
  tab: 'Agent',
  cta: 'Umów wizytę za mnie',
  ctaA11y: 'Umów wizytę za mnie: wybierz specjalistę i przychodnię, agent zadzwoni',
  planLink: 'Co warto umówić? Zobacz plan badań',
  noProfile: 'Najpierw dodaj profil — agent musi wiedzieć, kogo umawia.',
  noProfileCta: 'Dodaj profil',
  // Measured phone time only — no invented "average wait" figures (AGENTS.md: no made-up data).
  ring: {
    centerLabel: 'zaoszczędzone',
    waited: 'Czekanie na linii',
    talked: 'Rozmowa z rejestracją',
    // "rozmów" / "wizyt" with a count would need declension — "…: N" avoids it.
    footer: 'Rozmowy: {{calls}} · umówione wizyty: {{booked}}',
    none: 'Zleć pierwszy telefon, a policzę, ile czasu Ci oszczędzam.',
    a11y: 'Zaoszczędzony czas: {{total}}. Czekanie na linii {{waited}}, rozmowa {{talked}}.',
  },
  active: 'W toku',
  history: 'Historia',
  open: 'Otwórz rozmowę',
  detail: {
    title: 'Rozmowa',
    conversation: 'Przebieg rozmowy',
    noTranscript: 'Brak zapisu — nikt nie odebrał albo rozmowa się nie odbyła.',
    notFound: 'Nie znaleziono tej rozmowy',
    remove: 'Usuń z historii',
  },
  taskA11y: '{{exam}}, {{facility}}, {{status}}',
  forProfile: 'Dla: {{name}}',
} as const;
