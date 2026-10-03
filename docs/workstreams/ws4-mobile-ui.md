# WS4 — Mobile UI & design system

**Właściciel:** _____ · **Katalogi:** `apps/mobile/src/{theme,components,features/plan,features/facilities,features/visit-prep}`
Czytaj: `AGENTS.md` (§3 RN — dostępność!), `docs/01-user-journey.md`, `docs/03-contracts.md`. Makiety i tokeny od WS5.

**Design = 20% oceny.** Lepiej mniej ekranów, ale dopracowanych. Jeden główny CTA na ekran.

## Zadania

### WS4-1 · Theme (≤ 45 min, odblokowuje WS3)
- [x] `theme/tokens.ts`: kolory (light/dark), spacing (4-pt grid), radius, typografia w dwóch skalach: `normal` i `senior` (×1.3)
- [x] Kolory semantyczne: `urgent`, `soon`, `later`, `done`, `booked` + kontrast AA na tle (sprawdzone narzędziem)
- [x] `useTheme()` czyta `seniorMode`/`darkMode` ze store'u WS3 (do tego czasu: lokalny stan)

### WS4-2 · Komponenty bazowe
- [x] `Button` (primary/secondary/ghost, loading, min. 44 pt), `Card`, `Chip`/`Badge`, `Screen` (safe area + scroll), `Text` (warianty z tokenów), `ProgressBar`, `OptionTile` (duży wybór w ankiecie), `ProfileSwitcher`, `EmptyState`, `Disclaimer`
- [x] Każdy z `accessibilityRole`/`accessibilityLabel`; propsy typowane, bez stylów inline z magicznymi liczbami
- [x] Ekran `/dev/components` (tylko w dev) — galeria komponentów do szybkiego review

### WS4-3 · Ekran planu (oś czasu) — „wow moment”
- [x] Sekcje wg urgency, `ExamCard` z jednym CTA zależnym od `booking` (`01-user-journey.md` §UX)
- [x] Linia czasu z animacją wejścia (`react-native-reanimated`, subtelnie — 300 ms, respektuj „ogranicz ruch”)
- [ ] Na mockach (`mockPlan()` z WS1), potem `usePlan()` od WS3

### WS4-4 · Karta badania `exam/[examId]`
- [x] Dlaczego (reasons), jak często, czy skierowanie, „jak się przygotować”, źródło (link), disclaimer, dopisek „wartość orientacyjna” dla `verified: false`
- [x] Info o kolejce: „W promieniu X km czeka się ok. N tyg. (stan na …)”
- [x] CTA: znajdź termin / gdzie zrobić (program) / oznacz jako zrobione / umówiłem się

### WS4-5 · Placówki `exam/[examId]/facilities`
- [ ] Lista: nazwa, adres, odległość, średni czas oczekiwania „ok. N tyg.” (lub „brak danych”) — NFZ nie podaje dziś konkretnych terminów, ikonki dostępności, przycisk „Zadzwoń” (`Linking.openURL('tel:…')`), „Nawiguj” (link do map)
- [ ] Przełącznik sortowania: najszybciej / najbliżej
- [ ] Mapa: `FacilitiesMap.tsx` (`react-native-maps`) + `FacilitiesMap.web.tsx` (`react-leaflet` + OSM); markery kolorowane wg czasu oczekiwania
- [ ] Stany: ładowanie (skeleton), błąd (retry), pusto, `source: 'nfz_snapshot'` → dyskretna informacja

### WS4-6 · Przygotowanie do wizyty `visit-prep`
- [ ] Ekran: dane profilu (wiek, czynniki ryzyka), lista badań do omówienia / skierowań, pytania do lekarza
- [ ] „Pobierz PDF / Udostępnij”: `expo-print` → `expo-sharing`; web: `window.print()` ze stylami print
- [ ] Bez danych identyfikujących poza imieniem

### WS4-7 · Polish (T+16 – T+20)
- [ ] Tryb senior i dark mode na każdym ekranie
- [x] Ikona aplikacji, splash, favicon/tytuł dla web
- [ ] Screenshoty do prezentacji (dla WS5)

## Definition of Done (WS4)
Zgodne z makietami WS5; działa w trybie senior i dark; VoiceOver/TalkBack czyta sensownie główny flow; brak hardkodowanych kolorów/stringów; iOS + Android + web.
