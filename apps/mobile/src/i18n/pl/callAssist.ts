export const callAssist = {
  title: 'Zadzwoń za mnie',
  eyebrow: 'Demo · asystent głosowy AI',
  heading: 'Zadzwonimy za Ciebie',
  intro:
    'Asystent AI zadzwoni do rejestracji ({{facility}}) i poprosi o termin na badanie: {{exam}}.',
  points: {
    disclosure: 'Na początku rozmowy powie, że jest asystentem AI i w czyim imieniu dzwoni.',
    privacy: 'Przekażemy tylko nazwę badania, placówkę i imię. Bez PESEL i nazwiska.',
    demo: 'Wersja demo: dzwoni na numer testowy zespołu, nie do placówki.',
  },
  start: 'Zadzwoń',
  startA11y: 'Zadzwoń za mnie: asystent AI zadzwoni i poprosi o termin',
  status: {
    starting: 'Łączę…',
    queued: 'Łączę…',
    ringing: 'Dzwonię…',
    in_progress: 'Rozmowa · {{time}}',
    ended: 'Rozmowa zakończona',
    analysing: 'Sprawdzam ustalenia…',
  },
  simulated: 'Symulacja — bez prawdziwego połączenia',
  speaker: { agent: 'Asystent AI', clinic: 'Rejestracja' },
  waitingForWords: 'Rozmowa się zaczyna…',
  booked: {
    eyebrow: 'Umówiono',
    when: '{{weekday}}, godz. {{time}}',
    whenNoTime: '{{weekday}}',
    saved: 'Zapisaliśmy wizytę w planie. Przypomnimy dzień wcześniej.',
    a11y: 'Umówiono wizytę: {{date}}',
  },
  notBooked: {
    title: 'Nie udało się umówić terminu',
    body: 'Rejestracja nie podała konkretnego terminu. Możesz spróbować ponownie albo wpisać termin ręcznie.',
  },
  failed: {
    title: 'Połączenie nie doszło do skutku',
    body: 'Nikt nie odebrał albo linia była zajęta. Spróbuj ponownie za chwilę.',
  },
  error: 'Nie udało się połączyć z serwerem. Sprawdź internet i spróbuj ponownie.',
  done: 'Gotowe',
  fixDate: 'Popraw datę',
  retry: 'Spróbuj ponownie',
  manual: 'Wpisz termin ręcznie',
  // Spoken by the agent in Polish accusative: "Chciałabym zapisać {{forWhom}}…"
  forWhom: {
    self: { female: 'ją', male: 'go' },
    parent: { female: 'mamę', male: 'tatę' },
    partner: { female: 'partnerkę', male: 'partnera' },
    child: { female: 'córkę', male: 'syna' },
    other: { female: 'bliską osobę', male: 'bliską osobę' },
  },
  // "…w imieniu {{callerName}}" when we don't know the caregiver's name
  callerFallback: 'rodziny',
} as const;
