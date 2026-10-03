# NaCzas — planer profilaktyki z dostępnością NFZ

> HackYeah 2026 · Open Task **SPORT & HEALTHCARE** · zespół **{NAZWA ZESPOŁU}**
> Nazwa „NaCzas” może się jeszcze zmienić — alternatywy: [pitch/naming.md](pitch/naming.md).

**Demo (web):** {LINK DO DEMO} · **Expo Go:** {QR / LINK} · **Wideo:** {LINK DO WIDEO}

*Wiesz co, kiedy i gdzie — zanim będzie za późno.*


## Problem i rozwiązanie

Ludzie odkładają badania profilaktyczne, bo nie pamiętają, kiedy je robili, nie wiedzą, które ich dotyczą, i przypominają sobie za późno — a na kolonoskopię w połowie placówek NFZ czeka się średnio ponad 4,5 miesiąca ([skąd ta liczba](pitch/slides-outline.md)). NaCzas na podstawie krótkiej ankiety układa indywidualny plan badań dla Ciebie i Twoich bliskich, z uzasadnieniem i źródłem każdego zalecenia. Na podstawie realnych kolejek NFZ w okolicy mówi, **kiedy zacząć organizować** badanie, żeby zdążyć, i **gdzie** zrobić je najszybciej.

> Aplikacja edukuje i przypomina — **nie diagnozuje i nie zastępuje lekarza**.

## Główne funkcje

- **Ankieta** — jeden temat na ekran, zawsze opcja „nie wiem”; dla siebie i dla bliskiej osoby.
- **Plan badań** — oś czasu w sekcjach _Działaj teraz / W tym roku / Później / Zrobione_, każde badanie z uzasadnieniem i linkiem do źródła.
- **„Kiedy zacząć szukać”** — `termin badania − czas oczekiwania w okolicy (p75 z NFZ) − zapas na skierowanie` ([algorytm](docs/05-scheduling-algorithm.md)).
- **Placówki NFZ** — lista i mapa, sortowanie „najszybciej / najbliżej”, przycisk „Zadzwoń”, informacja o dostępności (winda, podjazd, parking).
- **Ścieżka programów bez kolejki** — mammografia, test HPV, „Moje Zdrowie”: bez skierowania, link do programu.
- **Profile rodzinne** — opiekun prowadzi plan rodzica na swoim telefonie.
- **Przygotowanie do wizyty** — podsumowanie dla lekarza POZ („proszę o skierowanie na…”) jako ekran / PDF.
- **Statusy i powiadomienia** — zaplanowane → umówione → zrobione, lokalne przypomnienia, tryb „przewiń czas” na demo.
- **Dostępność** — tryb senior (typografia ×1.3, większe pola dotyku, wyższy kontrast), dark mode, kontrast WCAG AA ([tokeny](docs/design/tokens.md)).
- **Prywatność** — bez kont; dane zdrowotne nie opuszczają telefonu.

## Architektura

```
┌──────────────────────── apps/mobile (Expo, TS) ────────────────────────┐
│ expo-router · zustand+persist(AsyncStorage) · expo-notifications       │
│ expo-location · expo-print/expo-sharing · react-native-maps / Leaflet  │
│                                                                        │
│  Profile, ExamRecord ──► @naczas/rules.computePlan(profile, records,   │
│  (tylko lokalnie)                     waitTimes, today) ──► Plan       │
└───────────────┬────────────────────────────────────────────────────────┘
                │ HTTPS: benefit, province, lat/lng (≈1 km) — ZERO danych zdrowotnych
┌───────────────▼──────────────── apps/api (Hono, Node) ─────────────────┐
│ GET /v1/wait-times   GET /v1/facilities   GET /v1/health               │
│ nfz/client.ts: rate limit · retry · timeout · cache (LRU, TTL 24h)     │
│ fallback: data/snapshot/*.json (nagrane z NFZ, commitowane do repo)    │
└───────────────┬────────────────────────────────────────────────────────┘
                ▼
     api.nfz.gov.pl/app-itl-api (Terminy leczenia)   [opc. app-umw-api]
```

Monorepo pnpm:

| Pakiet | Co robi |
|---|---|
| `apps/mobile` | Aplikacja Expo (iOS, Android, web) |
| `apps/api` | Cienkie proxy do API NFZ: agregacja czasów oczekiwania, cache, fallback na snapshot |
| `packages/rules` | Silnik reguł i algorytm terminów — czysty TypeScript + `data/*.json` z regułami i źródłami |
| `packages/shared` | Typy domenowe i schematy Zod (kontrakty między pakietami) |

Szczegóły i decyzje: [docs/02-architecture.md](docs/02-architecture.md).

## Jak uruchomić

Wymagania: Node ≥ 22, corepack (dołączony do Node). Opcjonalnie Expo Go na telefonie.

```bash
corepack pnpm install
```

Zmienne środowiskowe — skopiuj przykład do katalogu aplikacji mobilnej (Expo czyta `.env` z katalogu projektu):

```bash
cp .env.example apps/mobile/.env
```

| Zmienna | Domyślnie | Znaczenie |
|---|---|---|
| `EXPO_PUBLIC_API_URL` | `http://localhost:8787` | adres API |
| `EXPO_PUBLIC_USE_MOCKS` | `1` | `1` = aplikacja działa na wbudowanych danych przykładowych, bez zapytań do API; każda inna wartość = łączy się z `apps/api` |

API nie czyta pliku `.env` — działa na wartościach domyślnych (port `8787`, start z zapasowej kopii danych NFZ w `apps/api/data/snapshot/` i odświeżanie w tle). Zmiany przez zmienne środowiskowe przy starcie, np. `PORT=9000 corepack pnpm dev:api`; pełna lista z opisami: `.env.example` i `apps/api/src/env.ts`.

> `EXPO_PUBLIC_*` trafia do bundla klienta — nigdy nie wpisuj tam sekretów. Projekt nie wymaga żadnych kluczy (API NFZ jest publiczne).

Start (w osobnych terminalach):

```bash
corepack pnpm dev:api
```

```bash
corepack pnpm dev:web
```

Na telefonie: `corepack pnpm dev:mobile` i zeskanuj QR w Expo Go. Wszystko naraz: `corepack pnpm dev`.

> Skrypty w `package.json` wołają `pnpm` bezpośrednio. Jeśli `pnpm` nie jest w `PATH`, uruchom raz `corepack enable` (zmienia globalną konfigurację Node — instaluje shim `pnpm`).

Testy i lint (to samo co CI) — 609 testów: silnik reguł 154 (100% pokrycia linii), API 93, aplikacja 337, kontrakty 25 (stan na 2026-10-03):

```bash
corepack pnpm check
```

## Źródła danych

- **API NFZ „Terminy leczenia”** — `https://api.nfz.gov.pl/app-itl-api` (publiczne, bez klucza): placówki, średni czas oczekiwania raportowany przez placówki (aktualizacja ok. raz w miesiącu — w aplikacji zawsze „stan na …”). Opis i pułapki: [docs/04-data-sources.md](docs/04-data-sources.md).
- **Zalecenia profilaktyczne** — wyłącznie oficjalne źródła (pacjent.gov.pl, nfz.gov.pl, gov.pl, Dziennik Ustaw), każda reguła z polem `source` i datą weryfikacji; wartości niezweryfikowane aplikacja oznacza jako „orientacyjne”. Weryfikacja z cytatami: [docs/research/exams-verified.md](docs/research/exams-verified.md), mapowanie na świadczenia NFZ: [docs/research/nfz-benefits.md](docs/research/nfz-benefits.md).
- **Mapy** — web: OpenStreetMap przez Leaflet (© współtwórcy OpenStreetMap, licencja ODbL); iOS/Android: mapy systemowe przez `react-native-maps`.

## Ujawnienie użycia AI i zasobów zewnętrznych

Zgodnie z regulaminem HackYeah 2026 ([docs/07](docs/07-pitch-and-submission.md)). Cały kod powstał w trakcie hackathonu; przed startem przygotowaliśmy wyłącznie dokumentację koncepcyjną (`docs/`, `AGENTS.md`).

### Narzędzia AI

| Narzędzie | Do czego użyte |
|---|---|
| **Claude Code** (Anthropic) z modelem **Claude Opus 5.5** | Agenci AI pracujący równolegle w osobnych gałęziach (workstreamy) pod nadzorem zespołu, według zasad z [AGENTS.md](AGENTS.md): generowanie i refaktoryzacja kodu (TypeScript, React Native, Hono), pisanie testów, konfiguracja monorepo; research źródeł (programy NFZ, czasy oczekiwania, konkurencja) z obowiązkiem podania URL; projekt tokenów i makiet z wyliczeniem kontrastu WCAG; szkice dokumentacji, slajdów i skryptu pitchu. {ZESPÓŁ: uzupełnić / skorygować wg faktycznego użycia w każdym workstreamie} |

Zasady, których się trzymaliśmy:
- **AI nie generuje zaleceń medycznych.** Przedziały wieku i interwały pochodzą z oficjalnych źródeł z cytatem i URL; reguła bez źródła (nazwa + URL https) i daty weryfikacji nie przechodzi testów (`packages/rules/test/rules-data.test.ts`).
- Każda zmiana przechodzi lint, typecheck i testy (`pnpm check`) przed scaleniem; commity z udziałem AI mają trailer `Co-Authored-By`.
- Zespół rozumie i potrafi wyjaśnić architekturę, algorytm i każdy fragment kodu, także wygenerowany.

### API i dane
- API NFZ „Terminy leczenia” (`api.nfz.gov.pl/app-itl-api`) — dane publiczne NFZ.
- Treści i dane statystyczne z pacjent.gov.pl, nfz.gov.pl, gov.pl; pełna lista źródeł liczb z prezentacji: [pitch/slides-outline.md](pitch/slides-outline.md).
- OpenStreetMap (ODbL) — kafelki mapy w wersji web.

### Biblioteki open source (główne)
Expo, React Native, React, react-native-web, expo-router, zustand, Zod, date-fns, Hono (+ `@hono/node-server`), react-native-maps, Leaflet, react-leaflet, react-native-reanimated; narzędzia: TypeScript, ESLint, Prettier, Vitest, Jest (jest-expo), tsx, pnpm. Pełna lista i wersje: pliki `package.json` w repo.

## Dokumentacja

| Plik | Zawartość |
|---|---|
| [AGENTS.md](AGENTS.md) | Zasady pracy ludzi i agentów AI: jakość, testy, git, Definition of Done |
| [docs/00-overview.md](docs/00-overview.md) | Problem, persona, zakres MVP |
| [docs/01-user-journey.md](docs/01-user-journey.md) | Ekrany, flow, scenariusz demo |
| [docs/02-architecture.md](docs/02-architecture.md) | Stack, struktura, decyzje techniczne |
| [docs/03-contracts.md](docs/03-contracts.md) | Typy i kontrakt API |
| [docs/04-data-sources.md](docs/04-data-sources.md) | API NFZ, lista badań |
| [docs/05-scheduling-algorithm.md](docs/05-scheduling-algorithm.md) | Algorytm „kiedy zacząć szukać” |
| [docs/06-workstreams.md](docs/06-workstreams.md), [docs/workstreams/](docs/workstreams/) | Podział pracy |
| [docs/07-pitch-and-submission.md](docs/07-pitch-and-submission.md) | Slajdy, zgłoszenie, Q&A |
| [docs/design/](docs/design/) | Tokeny i makiety ekranów |
| [docs/research/](docs/research/) | Weryfikacja zaleceń i mapowanie świadczeń NFZ |
| [pitch/](pitch/) | Treść slajdów, skrypt wystąpienia, propozycje nazwy |

## Zespół

{IMIĘ NAZWISKO — rola} · {IMIĘ NAZWISKO — rola} · {…}

## Licencja

Proponujemy **MIT** — pozwala NFZ, samorządom i organizacjom pacjentów swobodnie użyć i rozwinąć projekt. {DO DECYZJI ZESPOŁU: po akceptacji dodać plik `LICENSE` z nazwą właściciela praw.}
Dane NFZ i treści z serwisów rządowych podlegają warunkom ich wydawców; dane mapy — ODbL (OpenStreetMap).
