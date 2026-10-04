export const doctors = {
  title: 'Lekarze',
  specialty: {
    label: 'Specjalista',
    options: {
      dental_checkup: 'Dentysta',
      eye_check: 'Okulista',
      dermatolog: 'Dermatolog',
      endokrynolog: 'Endokrynolog',
      neurolog: 'Neurolog',
      colonoscopy_screening: 'Kolonoskopia',
    },
  },
  filters: {
    button: 'Filtry',
    buttonActive: 'Filtry ({{count}})',
    buttonA11y: 'Filtry: specjalista, odległość, udogodnienia, sortowanie',
    title: 'Filtry',
    close: 'Zamknij filtry',
    apply: 'Pokaż wyniki ({{count}})',
    applyLoading: 'Pokaż wyniki',
    distance: 'Odległość',
    distanceOptions: {
      any: 'Dowolna',
      '10': 'do 10 km',
      '25': 'do 25 km',
      '50': 'do 50 km',
    },
    features: 'Udogodnienia',
    featureOptions: {
      phone: 'Ma telefon',
      accessible: 'Bez barier',
      parking: 'Parking',
    },
  },
  // "pasuje: N z M" avoids Polish numeral declension (see facilities.summary).
  summary: '{{specialty}} · pasuje: {{count}} z {{total}}',
  noMatchTitle: 'Żadna placówka nie pasuje do filtrów',
  noMatchBody: 'Zwiększ odległość albo odznacz któreś udogodnienie.',
  clearFilters: 'Wyczyść filtry',
  mapExpand: 'Rozwiń mapę',
  mapCollapse: 'Zwiń mapę',
  mapHint: 'Dotknij pinezki, żeby zobaczyć placówkę i zadzwonić.',
};
