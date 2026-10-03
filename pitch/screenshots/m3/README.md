# M3 — przejście scenariusza demo (2026-10-03)

Branch `ws0/m3` z main `951b85b`. Web (Expo, 390×844, zrzuty @2x = 780×1688) + lokalne API (snapshot NFZ) oraz osobno z mockami (`EXPO_PUBLIC_USE_MOCKS=1`).
Scenariusz: `docs/01-user-journey.md` §Demo.

**Demo-ready: NIE.** Kroki 1–4 działają end-to-end z prawdziwym API. Kroki 5–7 blokują B1–B3 (szczegóły niżej).

## Co działa

- `/` → redirect do onboardingu po wyczyszczeniu localStorage. Onboarding mamy: 7 kroków, kod 00-950 → woj. 07.
- Plan z prawdziwym API: 4 zapytania `/v1/wait-times` (200), kolonoskopia pierwsza, „W okolicy czeka się ok. 29 tyg.” (p75 200 dni ze snapshotu).
- Karta badania: „W promieniu 15 km czeka się ok. 29 tyg., dane NFZ, stan na 2026-09”, źródło, disclaimer.
- Placówki: lista (sort po średnim czasie oczekiwania, odległość, dostępność, Zadzwoń/Nawiguj) i mapa Leaflet.
- Ustawienia: przewijanie czasu przelicza plan; tryb senior i dark czytelne na każdym ekranie.
- Głębokie linki (pełny reload) działają; `/onboarding/3` bez szkicu wraca do welcome; nieznane badanie ma komunikat.
- Mocki: zero zapytań `/v1/`. Konsola bez błędów na wszystkich ekranach w obu trybach.

## Bugi

| # | Waga | WS | Ekran | Kroki | Oczekiwane | Faktyczne |
|---|---|---|---|---|---|---|
| B1 | blocker | WS3 | `exam/[id]/book` | karta badania → „Umówiłem/am się” | date picker, zapis `booked`, potem „Zrobione” | placeholder „Umów termin”; brak `markBooked`/`markDone` → krok 6 demo niewykonalny |
| B2 | blocker | WS3 | `/family` | plan → „+” (Dodaj osobę) | lista osób + dodanie Kasi | placeholder „Rodzina”; Kasię da się dodać tylko ręcznie przez URL `/onboarding/welcome` |
| B3 | blocker | WS4 | `visit-prep` | dowolny profil → „Przygotuj prośbę do lekarza” | dane aktywnej osoby | zawsze `mockProfileMama` (TODO w `use-visit-prep.ts`): „Niska aktywność fizyczna” przy `activity: medium`, u Kasi pokazuje Mamę |
| H1 | wysoka | WS3 | welcome | „Wczytaj profil demo” po onboardingu | preset Mama + Kasia, bez duplikatów | dodaje tylko mockową Mamę, drugą „Mamę” obok istniejącej; brak presetu Kasi |
| H2 | wysoka | WS4 / WS1 | karta kolonoskopii | demo krok 5 | wejście do „Przygotowanie do wizyty” | link tylko gdy `rule.referral` (okulista, znamiona); z kolonoskopii i z planu brak wejścia |
| H3 | wysoka | WS4 | tab bar (wszystkie zakładki) | 390 px, normal i senior | pełne etykiety | etykiety ucięte: box 10 px w pasku 48 px („Plan”, „Rodzina”, „Ustawienia”) |
| H4 | wysoka | WS1 / WS5 | plan | mama, „Nie wiem / pomiń” w kroku 7 | czerwona kolonoskopia wyróżniona (scenariusz) | wszystkie 7 badań „Działaj teraz, zrób do 10.2026” → kolonoskopia nie odstaje; rozważyć preset z rekordami albo logikę dla `unknown` |
| M1 | średnia | WS4 | ProfileSwitcher | 2+ profile | badge z liczbą pilnych na profilu bliskiej osoby | badge tylko na aktywnym; przełącznik wychodzi poza ekran („+” ucięty) |
| M2 | średnia | WS4 | ExamCard | czytnik ekranu | jeden przycisk albo karta + osobny CTA | `role=button` zagnieżdżony w `role=button` |
| M3 | średnia | WS4 | karta / placówki | kolonoskopia | jeden promień | karta „w promieniu 15 km”, lista pyta `radiusKm=25`; „placówek: 20” to limit, nie liczba |
| M4 | średnia | WS4 | mapa | Mapa | wszystkie znaczniki w kadrze, pozycja użytkownika | brak `fitBounds` (Józefów/Karczew/Otwock ucięte), brak znacznika użytkownika, nakładające się znaczniki |
| M5 | średnia | WS3 | dowolny zły URL | `/nie-ma-takiej-strony` | polski ekran 404 | domyślne „Unmatched Route … Sitemap” (brak `app/+not-found.tsx`) |
| M6 | średnia | WS4 | plan, karta „Umówione” | „Oznacz jako zrobione” | oznacza jako zrobione | tylko otwiera kartę badania (akcja jest dopiero tam) |
| L1 | niska | WS3 | onboarding krok 3 | kod 00-950 | „Warszawa, woj. mazowieckie” | „Kod 00-950, woj. mazowieckie” |
| L2 | niska | WS3 | onboarding „Gotowe!” | koniec ankiety | animowane przejście (docs) | pusty ekran z jednym zdaniem |
| L3 | niska | WS3 | onboarding krok 1 | wybór „Dla mnie / bliskiej osoby” | stabilny układ | pojawia się „Pytamy o …” i treść skacze ~30 px (ryzyko złego tapnięcia) |
| L4 | niska | WS3 | onboarding „Dla mnie” | — | imię (Kasia) | profil „Ja”, plan „Plan badań — Ja” |
| L5 | niska | WS1 | karta kolonoskopii | Skierowanie | spójnie | „bez skierowania (program)”, a „Znajdź termin” prowadzi do kolejek AOS (ITL), które skierowania wymagają |
| L6 | niska | WS4 | karta badania spoza planu osoby | `/exam/colonoscopy_screening` przy profilu Kasi | „to badanie Cię nie dotyczy” | „Nie mamy aktualnych danych o kolejce” (myląca przyczyna) |
| L7 | info | WS3 | tryb mocków | przewijanie czasu, zmiany rekordów | plan się przelicza | `usePlan` w mockach zwraca statyczny `mockPlan` — do demo bez sieci OK, ale nie pokaże przewijania czasu |

Naprawione w tym branchu (WS0):
- `.env.example` miało `EXPO_PUBLIC_USE_MOCKS=true`, a `client.ts` włącza mocki tylko dla `'1'` (czyli „true” = prawdziwe API). `docs/deploy.md` kazało ustawić `false`. Jest teraz `1` / `0` z komentarzem.
- Jest: globalny mock AsyncStorage (`apps/mobile/jest.setup.ts`). Lokalne mocki u innych zostały, usunąłem je tylko z własnych testów.

Niesprawdzone: druk PDF na web (systemowe okno druku blokuje automatyzację), natywne powiadomienia i Expo Go na telefonie.

## Zrzuty (390×844 @2x)

| Plik | Ekran |
|---|---|
| `01-welcome.png` | powitanie |
| `02-onboarding-family-history.png` | ankieta, krok 5 |
| `03-plan-mama.png` | plan mamy (prawdziwe API) |
| `04-exam-colonoscopy.png` | karta kolonoskopii, „ok. 29 tyg.” |
| `05-facilities-list.png` | placówki — lista |
| `06-facilities-map.png` | placówki — mapa |
| `07-visit-prep.png` | przygotowanie do wizyty (uwaga: dane mockowe, B3) |
| `08-plan-kasia.png` | plan drugiej osoby („Ja”) |
| `09-plan-mocks-booked.png` | plan w trybie mocków (sekcje Działaj teraz / Umówione) |
| `10-plan-dark-senior.png` | plan w dark + senior |
