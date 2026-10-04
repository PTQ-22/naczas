export const agent = {
  tab: 'Agent',
  eyebrow: 'Twój asystent AI',
  title: 'Dzwonię do przychodni za Ciebie',
  body: 'Wiszę na infolinii, dzwonię ponownie, gdy nikt nie odbiera, i umawiam termin, który Ci pasuje.',
  cta: 'Umów wizytę za mnie',
  ctaA11y: 'Umów wizytę za mnie: wybierz specjalistę i przychodnię, agent zadzwoni',
  planLink: 'Co warto umówić? Zobacz plan badań',
  noProfile: 'Najpierw dodaj profil — agent musi wiedzieć, kogo umawia.',
  noProfileCta: 'Dodaj profil',
  saved: {
    title: 'Zaoszczędzony czas',
    // Measured phone time only — no invented "average wait" figures (AGENTS.md: no made-up data).
    detail: 'Na linii czekałem {{waited}} · rozmów: {{calls}} · umówione wizyty: {{booked}}',
    none: 'Jeszcze nic — zleć pierwszy telefon, a policzę, ile czasu Ci oszczędzam.',
  },
  active: 'W toku',
  history: 'Historia',
  empty: 'Brak zleceń. Wybierz specjalistę i przychodnię, a zadzwonię za Ciebie.',
  open: 'Otwórz rozmowę',
  taskA11y: '{{exam}}, {{facility}}, {{status}}',
  forProfile: 'Dla: {{name}}',
  clearHistory: 'Wyczyść historię',
} as const;
