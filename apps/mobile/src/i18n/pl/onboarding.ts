export const onboarding = {
  welcome: {
    title: 'Witaj w NaCzas',
    subtitle:
      'Podpowiemy, jakie badania profilaktyczne warto zrobić i kiedy zacząć szukać terminu.',
    privacy: 'Twoje odpowiedzi zostają na tym urządzeniu. Nie wysyłamy danych o zdrowiu.',
    disclaimer:
      'NaCzas przypomina i edukuje — nie stawia diagnozy i nie zastępuje lekarza. Zalecenia opierają się na programach profilaktycznych NFZ i wytycznych.',
    start: 'Zaczynamy',
    loadDemo: 'Wczytaj profil demo',
  },
  nav: {
    back: 'Wstecz',
    next: 'Dalej',
    skip: 'Pomiń',
    dontKnow: 'Nie wiem / pomiń',
    progress: 'Krok {{current}} z {{total}}',
  },
  steps: {
    who: {
      title: 'Dla kogo jest ten plan?',
      self: 'Dla mnie',
      other: 'Dla bliskiej osoby',
      nameLabel: 'Imię',
      namePlaceholder: 'np. Mama',
      relationLabel: 'Kim jest dla Ciebie?',
      relation: {
        parent: 'Rodzic',
        partner: 'Partner / partnerka',
        child: 'Dziecko',
        other: 'Inna osoba',
      },
    },
    basics: {
      title: 'Rok urodzenia i płeć',
      birthYearLabel: 'Rok urodzenia',
      sexLabel: 'Płeć',
      sex: {
        female: 'Kobieta',
        male: 'Mężczyzna',
      },
      birthYearError: 'Podaj rok między {{min}} a {{max}}',
    },
    location: {
      title: 'Gdzie szukać placówek?',
      hint: 'Lokalizacja służy tylko do pokazania najbliższych placówek NFZ i czasu oczekiwania.',
      useGps: 'Użyj mojej lokalizacji',
      postalLabel: 'Kod pocztowy',
      postalPlaceholder: '00-000',
      postalError: 'Wpisz kod w formacie 00-000',
      gpsDenied: 'Brak zgody na lokalizację — wpisz kod pocztowy.',
    },
    conditions: {
      title: 'Choroby przewlekłe',
      hint: 'Zaznacz wszystkie, które dotyczą tej osoby.',
      options: {
        diabetes: 'Cukrzyca',
        hypertension: 'Nadciśnienie',
        heart_disease: 'Choroby serca',
        other: 'Inne',
      },
      none: 'Żadne z powyższych',
    },
    familyHistory: {
      title: 'Choroby w rodzinie',
      hint: 'U rodziców, rodzeństwa lub dzieci.',
      options: {
        breast_cancer: 'Rak piersi',
        colorectal_cancer: 'Rak jelita grubego',
        prostate_cancer: 'Rak prostaty',
        ovarian_cancer: 'Rak jajnika',
        early_cardiovascular: 'Zawał lub udar przed 60. rokiem życia',
      },
      none: 'Żadne z powyższych',
    },
    lifestyle: {
      title: 'Styl życia',
      smokingLabel: 'Palenie papierosów',
      smoking: {
        never: 'Nigdy',
        former: 'Kiedyś',
        current: 'Obecnie',
      },
      packYearsLabel: 'Ile lat, licząc paczkę dziennie?',
      activityLabel: 'Aktywność fizyczna (min. 30 min)',
      activity: {
        low: '0–1 dni w tygodniu',
        medium: '2–3 dni w tygodniu',
        high: '4+ dni w tygodniu',
      },
      heightLabel: 'Wzrost (cm) — opcjonalnie',
      weightLabel: 'Waga (kg) — opcjonalnie',
    },
    lastExams: {
      title: 'Kiedy ostatnio?',
      hint: 'Pytamy tylko o badania, które dotyczą tej osoby.',
      answers: {
        within_1y: 'W ostatnim roku',
        '1_3y': '1–3 lata temu',
        over_3y: 'Dawniej',
        never: 'Nigdy',
        unknown: 'Nie pamiętam',
      },
      empty: 'Na razie nie ma badań do uzupełnienia.',
    },
  },
  done: {
    title: 'Gotowe!',
    subtitle: 'Przygotowaliśmy plan badań.',
    cta: 'Zobacz plan',
  },
  errors: {
    restoreFailed: 'Nie udało się odczytać zapisanych danych. Zaczynamy od nowa.',
  },
} as const;
