export const bet = {
  tabs: {
    bet: 'Zakład',
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
      'Wybierz kwotę, którą symbolicznie stawiasz na swoje zdrowie. Jeśli nie wykonasz pilnych badań na czas — „przegrasz" ją na cele charytatywne.',
    amountLabel: 'Kwota zakładu',
    examCount: 'Zakład obejmie {{count}} pilnych badań',
    noExams: 'Brak pilnych badań — wszystko zrobione na czas!',
    confirm: 'Stawiam!',
    confirmA11y: 'Złóż zakład o zdrowie na wybraną kwotę',
    deadlineInfo: 'Termin: {{days}} dni od dziś',
    payButton: 'Zablokuj {{amount}} zł (Apple Pay)',
    payDisclaimer:
      'Kwota zostanie pobrana TYLKO jeśli zignorujesz badania. W przypadku przegranej, 100% zablokowanej kwoty trafia do Fundacji WOŚP.',
  },
  history: {
    title: 'Historia zakładów',
    empty: 'Jeszcze nie złożono żadnego zakładu.',
    won: 'Wygrana',
    lost: 'Przegrana',
    active: 'W toku',
    wonMessage: 'Brawo! Dbasz o zdrowie! 🎉 Twoje pieniądze zostały odblokowane.',
    lostMessage:
      'Przegrana. Twoje {{amount}} zł właśnie zasiliło konto Fundacji WOŚP. Dziękujemy za wsparcie!',
  },
  disclaimer:
    'Zakład o zdrowie to motywator — żadne prawdziwe pieniądze nie są pobierane. Kwota jest symboliczna i ma Cię zmotywować do regularnych badań profilaktycznych.',
} as const;
