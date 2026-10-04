export const bet = {
  tabs: {
    bet: 'Zakład',
  },
  // Entry row on the plan.
  entry: {
    title: 'Zakład o zdrowie',
    body: 'Postaw symboliczną kwotę, że zrobisz badania z planu na ten rok.',
    active: '{{amount}} zł na szali · wykonano {{completed}} z {{total}}',
  },
  screen: {
    title: 'Zakład o zdrowie',
    subtitle: 'Postaw na swoje zdrowie — zmotywuj się do badań!',
  },
  active: {
    title: 'Twój aktualny zakład',
    amount: '{{amount}} zł na szali',
    deadline: 'Termin: {{date}}',
    progress: 'Wykonano {{completed}} z {{total}} badań',
    motivationGood: 'Świetnie Ci idzie! Tak trzymaj! 💪',
    motivationHalf: 'Połowa drogi za Tobą — nie zwalniaj!',
    motivationStart: 'Czas zacząć — Twoje zdrowie jest tego warte!',
  },
  place: {
    title: 'Złóż nowy zakład',
    description:
      'Wybierz kwotę, którą symbolicznie stawiasz na swoje zdrowie. Jeśli nie zrobisz tych badań na czas — „przegrasz" ją na cele charytatywne.',
    amountLabel: 'Kwota zakładu',
    examCount: 'Badania objęte zakładem: {{count}}',
    noExams: 'Brak pilnych badań — wszystko zrobione na czas!',
    confirm: 'Stawiam!',
    confirmA11y: 'Złóż zakład o zdrowie na wybraną kwotę',
    deadlineInfo: 'Termin: {{days}} dni od dziś',
    // Nothing is charged — the button must not look like a payment (docs/ux-review-first-run.md #8).
    payButton: 'Stawiam symbolicznie {{amount}} zł',
    payDisclaimer: 'Jeśli nie zdążysz, umówmy się, że ta kwota trafi do Fundacji WOŚP.',
  },
  history: {
    title: 'Historia zakładów',
    empty: 'Jeszcze nie złożono żadnego zakładu.',
    won: 'Wygrana',
    lost: 'Przegrana',
    active: 'W toku',
    wonMessage: 'Brawo! Dbasz o zdrowie! 🎉',
    lostMessage: 'Tym razem się nie udało. Może {{amount}} zł dla Fundacji WOŚP mimo wszystko?',
  },
  disclaimer:
    'Zakład o zdrowie to motywator — żadne prawdziwe pieniądze nie są pobierane. Kwota jest symboliczna i ma Cię zmotywować do regularnych badań profilaktycznych.',
} as const;
