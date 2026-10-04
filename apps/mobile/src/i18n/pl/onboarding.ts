export const onboarding = {
  welcome: {
    title: 'Witaj w NaCzas',
    subtitle:
      'Podpowiemy, jakie badania profilaktyczne warto zrobić i kiedy zacząć szukać terminu.',
    privacy: 'Twoje odpowiedzi zostają na tym urządzeniu. Nie wysyłamy danych o zdrowiu.',
    disclaimer:
      'Aplikacja przypomina o badaniach profilaktycznych i pomaga je zaplanować, ale nie stawia diagnozy i nie zastępuje lekarza. Jeśli coś Cię niepokoi albo masz objawy, porozmawiaj z lekarzem rodzinnym.',
    start: 'Zaczynamy',
    resume: 'Dokończ rozpoczętą ankietę',
    loadDemo: 'Wczytaj profil demo',
    login: 'Masz już Konto Rodzinne? Zaloguj się',
  },
  nav: {
    back: 'Wstecz',
    next: 'Dalej',
    skip: 'Pomiń',
    dontKnow: 'Nie wiem / pomiń',
    progress: 'Krok {{current}} z {{total}}',
    finish: 'Pokaż plan',
    askingAbout: 'Pytamy o: {{name}}',
    askingAboutSelf: 'Pytamy o Ciebie',
  },
  steps: {
    who: {
      title: 'Dla kogo jest ten plan?',
      self: 'Dla mnie',
      other: 'Dla bliskiej osoby',
      nameLabel: 'Imię',
      selfNameLabel: 'Twoje imię (opcjonalnie)',
      selfNamePlaceholder: 'Ja',
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
      gpsError: 'Nie udało się ustalić lokalizacji — wpisz kod pocztowy.',
      locating: 'Ustalam lokalizację…',
      selected: 'Wybrano: {{label}}',
      gpsLabel: 'Moja lokalizacja, woj. {{province}}',
      cityLabel: '{{city}}, woj. {{province}}',
      provinceLabel: 'woj. {{province}}',
      privacy:
        'Lokalizacja zostaje w telefonie; do wyszukiwania placówek wysyłamy ją zaokrągloną do ok. 1 km.',
      provinces: {
        '01': 'dolnośląskie',
        '02': 'kujawsko-pomorskie',
        '03': 'lubelskie',
        '04': 'lubuskie',
        '05': 'łódzkie',
        '06': 'małopolskie',
        '07': 'mazowieckie',
        '08': 'opolskie',
        '09': 'podkarpackie',
        '10': 'podlaskie',
        '11': 'pomorskie',
        '12': 'śląskie',
        '13': 'świętokrzyskie',
        '14': 'warmińsko-mazurskie',
        '15': 'wielkopolskie',
        '16': 'zachodniopomorskie',
      },
    },
    conditions: {
      title: 'Rozpoznane choroby',
      hint: 'Zaznacz te, które rozpoznał lekarz. Pytamy tylko o choroby, które zmieniają zalecane badania.',
      chukNote:
        'Przy cukrzycy, chorobie nerek, hipercholesterolemii rodzinnej lub chorobie serca badania serca prowadzi lekarz rodzinny zamiast programu profilaktyki ChUK.',
      options: {
        diabetes: 'Cukrzyca',
        chronic_kidney_disease: 'Przewlekła choroba nerek',
        familial_hypercholesterolemia: 'Rodzinna hipercholesterolemia',
        heart_disease: 'Choroba serca lub naczyń',
        immunosuppression: 'Zakażenie HIV lub leki immunosupresyjne',
      },
      why: {
        immunosuppression: 'Wtedy test HPV robi się co roku zamiast co 5 lat.',
      },
    },
    familyHistory: {
      title: 'Nowotwory w rodzinie',
      hint: 'U rodziców, rodzeństwa lub dzieci. Przy każdej z tych chorób dodamy pytanie o poradnię genetyczną do rozmowy z lekarzem.',
      options: {
        colorectal_cancer: 'Rak jelita grubego',
        breast_cancer: 'Rak piersi',
        ovarian_cancer: 'Rak jajnika',
        endometrial_cancer: 'Rak trzonu macicy',
      },
      why: {
        colorectal_cancer: 'Kolonoskopia w programie NFZ już od 40. roku życia.',
      },
    },
    lifestyle: {
      title: 'Palenie i ruch',
      smokingLabel: 'Palenie papierosów',
      smokingNote:
        'Od tej odpowiedzi zależy program antytytoniowy i badanie płuc (niskodawkowa tomografia).',
      smoking: {
        never: 'Nigdy',
        former: 'Kiedyś',
        current: 'Obecnie',
      },
      quitLabel: 'Jak dawno temu palenie zostało rzucone?',
      quit: {
        within15y: 'W ciągu ostatnich 15 lat',
        over15y: 'Ponad 15 lat temu',
      },
      packYearsLabel: 'Ile lat palenia, licząc paczkę dziennie?',
      packYearsHint: 'Np. 20 lat po pół paczki to 10.',
      copdLabel: 'Lekarz rozpoznał POChP (przewlekłą obturacyjną chorobę płuc)',
      otherLungRiskLabel: 'Czy dotyczy tej osoby któraś z sytuacji?',
      otherLungRiskHint:
        'Praca z azbestem, krzemionką, sadzą lub spalinami diesla · narażenie na radon · rak płuca u rodzica, rodzeństwa lub dziecka · przebyty chłoniak albo nowotwór głowy i szyi, pęcherza, nerki lub przełyku.',
      yes: 'Tak',
      no: 'Nie',
      activityLabel: 'Aktywność fizyczna (min. 30 min)',
      activityNote: 'Na tej podstawie dobierzemy wskazówkę w karcie „Ruch”.',
      activity: {
        low: '0–1 dni w tygodniu',
        medium: '2–3 dni w tygodniu',
        high: '4+ dni w tygodniu',
      },
    },
    lastExams: {
      title: 'Kiedy ostatnio?',
      hint: 'Pytamy tylko o badania, które dotyczą tej osoby. Jeśli nie pamiętasz, nic nie zaznaczaj.',
      // Buckets follow each exam's interval (last-done-labels.ts picks the unit and plural).
      answers: {
        withinHalf: {
          oneYear: 'W ostatnim roku',
          oneAndHalfYears: 'W ciągu ostatnich półtora roku',
          years: 'W ciągu ostatnich {{n}} lat',
          fractionYears: 'W ciągu ostatnich {{n}} roku',
          months: 'W ciągu ostatnich {{n}} miesięcy',
        },
        withinInterval: {
          years: {
            few: '{{from}}–{{to}} lata temu',
            many: '{{from}}–{{to}} lat temu',
            fraction: '{{from}}–{{to}} roku temu',
          },
          months: { few: '{{from}}–{{to}} miesiące temu', many: '{{from}}–{{to}} miesięcy temu' },
        },
        overInterval: {
          years: {
            one: 'Ponad rok temu',
            few: 'Ponad {{n}} lata temu',
            many: 'Ponad {{n}} lat temu',
            fraction: 'Ponad {{n}} roku temu',
          },
          months: { few: 'Ponad {{n}} miesiące temu', many: 'Ponad {{n}} miesięcy temu' },
        },
        never: 'Nigdy',
        unknown: 'Nie pamiętam',
      },
      // Segment labels on the timeline: "temu" is implied by the axis, months abbreviated.
      answersShort: {
        withinHalf: {
          oneYear: 'Do roku',
          oneAndHalfYears: 'Do 1,5 roku',
          years: 'Do {{n}} lat',
          fractionYears: 'Do {{n}} roku',
          months: 'Do {{n}} mies.',
        },
        withinInterval: {
          years: {
            few: '{{from}}–{{to}} lata',
            many: '{{from}}–{{to}} lat',
            fraction: '{{from}}–{{to}} roku',
          },
          months: { few: '{{from}}–{{to}} mies.', many: '{{from}}–{{to}} mies.' },
        },
        overInterval: {
          years: {
            one: 'Ponad rok',
            few: 'Ponad {{n}} lata',
            many: 'Ponad {{n}} lat',
            fraction: 'Ponad {{n}} roku',
          },
          months: { few: 'Ponad {{n}} mies.', many: 'Ponad {{n}} mies.' },
        },
        never: 'Nigdy',
        unknown: 'Nie pamiętam',
      },
      unanswered: 'Nie pamiętasz? Zostaw puste — zaplanujemy to badanie od dziś.',
      clear: 'Wyczyść — nie pamiętam',
      clearA11y: '{{exam}}: wyczyść odpowiedź, nie pamiętam',
      empty: 'Na razie nie ma badań do uzupełnienia.',
    },
  },
  notFound: {
    title: 'Nie ma takiej strony',
    body: 'Ten adres jest nieaktualny albo zawiera błąd.',
    cta: 'Przejdź do planu',
  },
  demo: {
    mamaName: 'Mama',
    kasiaName: 'Kasia',
  },
} as const;
