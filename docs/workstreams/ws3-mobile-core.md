# WS3 — Mobile core (dane, onboarding, profile, powiadomienia)

**Właściciel:** _____ · **Katalogi:** `apps/mobile/src/{store,services,features/onboarding,features/profiles,notifications}`, struktura `apps/mobile/app/`
Czytaj: `AGENTS.md` (§3 RN, §8), `docs/01-user-journey.md`, `docs/03-contracts.md`, `docs/05-scheduling-algorithm.md` §4.

Ekrany onboardingu budujesz z komponentów WS4 (`src/components`). Dopóki ich nie ma — proste placeholdery, bez własnych styli „na sztywno”.

## Zadania

### WS3-1 · Routing i szkielet (≤ 45 min)
- [ ] Wrappery `app/` i placeholdery ekranów są od WS0 — Ty: tab bar, `_layout.tsx` (providers), redirect w `index.tsx`
- [ ] Teksty w swoich plikach: `src/i18n/pl/{onboarding,profiles,settings}.ts`

### WS3-2 · Store (zustand + persist/AsyncStorage)
- [ ] `profiles` (CRUD, `activeProfileId`), `records` (`ExamRecord` per profil+badanie), `settings` (`seniorMode`, `darkMode`, `todayOverride?: ISODate`)
- [ ] Hook `useToday()` → `todayOverride ?? dzisiaj` — **jedyne** miejsce, gdzie aplikacja czyta bieżącą datę
- [ ] Walidacja Zod przy rehydracji (uszkodzone dane → reset z komunikatem, nie crash)
- [ ] Wersjonowanie `persist` (`version` + `migrate`)
- [ ] Testy store'ów (jest-expo)

### WS3-3 · API client + mocki
- [ ] `services/api.ts`: `getWaitTimes`, `getFacilities` — fetch z timeoutem, parsowanie Zod, typowane błędy
- [ ] `services/api.mock.ts` na fixtures WS2, przełącznik `EXPO_PUBLIC_USE_MOCKS`
- [ ] Hook `usePlan(profileId)`: pobiera wait-times dla badań `queue` (cache w pamięci + ostatni wynik w AsyncStorage), woła `computePlan` z `@naczas/rules`; offline → `leadTimeSource: 'default'`
- [ ] Zaokrąglanie współrzędnych do 2 miejsc przed wysłaniem

### WS3-4 · Onboarding
- [ ] Kroki 1–7 z `01-user-journey.md`; krok 7 generowany z `eligibleExams()`
- [ ] Lokalizacja: `expo-location` (zgoda) albo kod pocztowy → województwo (tabela prefiksów kodów pocztowych → województwo, przybliżona, w `services/postal.ts`) + centroid
- [ ] Pasek postępu, „Wstecz”, „Pomiń”, zapis stanu po każdym kroku (przerwanie ≠ utrata danych)
- [ ] Przycisk „Wczytaj profil demo” (persony z `plan.test.ts` WS1) — fallback na scenę
- [ ] Test: przejście całej ankiety tworzy poprawny `Profile` i `ExamRecord[]`

### WS3-5 · Profile rodzinne
- [ ] Ekran `family`: lista profili, dodaj osobę (start onboardingu w trybie „dla bliskiej osoby”), usuń (z potwierdzeniem)
- [ ] Przełącznik profilu (komponent od WS4) podpięty do `activeProfileId`

### WS3-6 · Statusy badań
- [ ] Akcje: `markBooked(examId, date)`, `markDone(examId, date)`, `setLastDone(...)`, cofnięcie
- [ ] Ekran `exam/[examId]/book.tsx` (date picker)

### WS3-7 · Powiadomienia
- [ ] `expo-notifications`: prośba o zgodę z kontekstem (po zobaczeniu planu, nie na starcie)
- [ ] `syncNotifications(plans)`: idempotentne — anuluj nasze, zaplanuj na `notifyDate 09:00` i `bookedFor − 1 dzień`; ID wg `05-scheduling-algorithm.md` §4
- [ ] Web: brak natywnych powiadomień → in-app banner
- [ ] Tryb demo: zmiana `todayOverride` w ustawieniach → natychmiastowe przeliczenie + przycisk „Wyślij testowe powiadomienie teraz”
- [ ] Test `syncNotifications` z zamockowanym modułem

### WS3-8 (stretch) · Health Connect / HealthKit
- [ ] Osobny branch, dev build; odczyt średniej liczby kroków z 30 dni → `activity` w profilu

## Definition of Done (WS3)
`pnpm --filter @naczas/mobile check` zielone; ankieta → plan działa na mockach i na prawdziwym API; dane przeżywają restart aplikacji; Expo Go iOS + Android + web.
