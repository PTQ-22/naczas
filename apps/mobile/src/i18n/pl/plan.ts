export const plan = {
  title: 'Plan badań',
  titleFor: 'Plan badań — {{name}}',
  summary: {
    none: 'Nic pilnego — wszystko na czas.',
    one: '1 badanie wymaga działania',
    few: '{{count}} badania wymagają działania',
    many: '{{count}} badań wymaga działania',
  },
  urgency: {
    act_now: 'Działaj teraz',
    this_year: 'W tym roku',
    later: 'Później',
    booked: 'Umówione',
    done: 'Zrobione',
  },
  section: {
    withCount: '{{label}} ({{count}})',
  },
  card: {
    waitWeeks: '~{{weeks}} tyg.',
    dueBy: 'Zrób do: {{date}}',
    bookedFor: 'Wizyta: {{date}}',
    nextAround: 'Następne: ok. {{year}}',
    whyNowQueue: 'Czeka się ok. {{weeks}} tyg. — zacznij szukać terminu.',
    startFrom: 'Zacznij szukać terminu od {{date}}.',
    estimatedWait: 'Szacunkowy czas oczekiwania',
    a11yHint: 'Otwiera szczegóły badania',
  },
  cta: {
    findSlot: 'Znajdź termin (~{{weeks}} tyg.)',
    findSlotA11y: 'Znajdź termin na: {{name}}, czeka się około {{weeks}} tygodni',
    program: 'Gdzie zrobić bez skierowania',
    walkIn: 'Bez zapisów — oznacz jako zrobione',
    markDone: 'Oznacz jako zrobione',
    a11ySuffix: '{{label}}: {{name}}',
  },
  empty: {
    title: 'Wszystko na czas',
    body: 'Nie ma teraz badań do zorganizowania.',
  },
  disclaimer: 'Aplikacja przypomina, nie diagnozuje.',
} as const;
