# NaCzas — planer profilaktyki z dostępnością NFZ

> HackYeah 2026 · Open Task **SPORT & HEALTHCARE** · zespół **{NAZWA ZESPOŁU}**
> Nazwa „NaCzas” może się jeszcze zmienić — alternatywy: [pitch/naming.md](pitch/naming.md).

**Demo (web):** {LINK DO DEMO} · **Expo Go:** {QR / LINK} · **Wideo:** {LINK DO WIDEO}

*Wiesz co, kiedy i gdzie — zanim będzie za późno.*


## Problem i rozwiązanie

Ludzie odkładają badania profilaktyczne, bo nie pamiętają, kiedy je robili, nie wiedzą, które ich dotyczą, i przypominają sobie za późno — a na kolonoskopię w połowie placówek NFZ czeka się średnio ponad 4,5 miesiąca ([skąd ta liczba](pitch/slides-outline.md)). NaCzas na podstawie krótkiej ankiety układa indywidualny plan badań dla Ciebie i Twoich bliskich, z uzasadnieniem i źródłem każdego zalecenia. Na podstawie realnych kolejek NFZ w okolicy mówi, **kiedy zacząć organizować** badanie, żeby zdążyć, i **gdzie** zrobić je najszybciej. Na koniec **agent głosowy AI może zadzwonić do rejestracji za Ciebie** i umówić wizytę w godzinach, które Ci pasują — termin trafia do planu.

> Aplikacja edukuje i przypomina — **nie diagnozuje i nie zastępuje lekarza**.

## Główne funkcje

- **Ankieta** — jeden temat na ekran, zawsze opcja „nie wiem”; dla siebie i dla bliskiej osoby.
- **Plan badań** — oś czasu w sekcjach _Działaj teraz / W tym roku / Później / Zrobione_, każde badanie z uzasadnieniem i linkiem do źródła.
- **„Kiedy zacząć szukać”** — `termin badania − czas oczekiwania w okolicy (p75 z NFZ) − zapas na skierowanie` ([algorytm](docs/05-scheduling-algorithm.md)).
- **Placówki NFZ** — lista i mapa, sortowanie „najszybciej / najbliżej”, przyciski „Zadzwoń” i „Zadzwoń za mnie”, informacja o dostępności (winda, podjazd, parking).
- **„Umów za mnie” — agent głosowy AI** — zaznaczasz w kalendarzu, kiedy możesz przyjść, a agent dzwoni do rejestracji, przedstawia się jako asystent AI, negocjuje termin w Twoich godzinach i ponawia połączenie, gdy nikt nie odbiera (do 3 prób, tylko w godzinach pracy rejestracji, pn–pt 7:30–18:00). Rozmowę widać na żywo jako transkrypcję; ustalony termin trafia do planu (z przypomnieniem dzień wcześniej), a jednym przyciskiem do kalendarza telefonu. Zakładka „Agent” zbiera zlecenia i historię rozmów. **W wersji demo agent dzwoni wyłącznie na numer testowy zespołu (`DEMO_CALL_TO`), nigdy do placówki; bez kluczy usług głosowych odtwarza symulowaną rozmowę.**
- **Lekarze i własne wizyty** — zakładka „Lekarze”: placówki NFZ wg specjalisty (dentysta, okulista, dermatolog, endokrynolog, neurolog, kolonoskopia) z filtrami odległości i udogodnień; do planu można dodać własną wizytę na NFZ spoza zaleceń.
- **Ścieżka programów bez kolejki** — mammografia, test HPV, „Moje Zdrowie”: bez skierowania, link do programu.
- **Profile rodzinne** — opiekun prowadzi plan rodzica na swoim telefonie.
- **Przygotowanie do wizyty** — podsumowanie dla lekarza POZ („proszę o skierowanie na…”) jako ekran / PDF.
- **Statusy i powiadomienia** — zaplanowane → umówione → zrobione, lokalne przypomnienia, tryb „przewiń czas” na demo.
- **Dostępność** — tryb senior (typografia ×1.3, większe pola dotyku, wyższy kontrast), dark mode, kontrast WCAG AA ([tokeny](docs/design/tokens.md)).
- **Prywatność** — bez zakładania konta; dane zdrowotne (profil, historia badań, czynniki ryzyka) domyślnie tylko na telefonie. Szczegóły niżej w [Prywatność — co i komu wysyłamy](#prywatność--co-i-komu-wysyłamy).

## Prywatność — co i komu wysyłamy

- **Domyślnie:** profil, historia badań i czynniki ryzyka są zapisane tylko na urządzeniu. Plan liczy się lokalnie.
- **Wyszukiwanie placówek i kolejek:** nasze API dostaje nazwę świadczenia NFZ, województwo i współrzędne zaokrąglone do ok. 1 km (bez danych zdrowotnych); logi API nie zawierają współrzędnych.
- **„Umów za mnie” (tylko gdy użytkownik zleci rozmowę):** do usługi telefonicznej trafia wyłącznie to, co potrzebne do rozmowy — dla kogo w formie relacji („mamę”, „tatę”, „ją” — bez imienia i nazwiska pacjenta), imię osoby zlecającej („w imieniu Kasi”), nazwa badania, nazwa placówki, termin „najpóźniej do” z planu i zaznaczone wolne godziny. Agent nie zna i nie podaje PESEL, nazwiska, adresu ani numeru telefonu. Przetwarzają to: **Vapi** (orkiestracja rozmowy), **OpenAI** (model rozmowy gpt-4o), **Deepgram** (transkrypcja mowy), **ElevenLabs** lub — gdy nie skonfigurowano głosu ElevenLabs — **Microsoft Azure** (synteza głosu), **Twilio** (telefonia). Status i transkrypcję rozmowy nasze API trzyma tylko w pamięci, do 6 h.
- **Synchronizacja rodzinna (logowanie, chmura):** ten sam plan na telefonie opiekuna i rodzica. W demo działa na testowej bazie (API z `DATABASE_URL`); w wersji produkcyjnej dane byłyby szyfrowane end-to-end.

## Architektura

```
┌──────────────────────── apps/mobile (Expo, TS) ────────────────────────┐
│ expo-router · zustand+persist(AsyncStorage) · expo-notifications       │
│ expo-location · expo-print/expo-sharing · react-native-maps / Leaflet  │
│ expo-calendar (termin wizyty → kalendarz telefonu / plik .ics na web)  │
│                                                                        │
│  Profile, ExamRecord ──► @naczas/rules.computePlan(profile, records,   │
│  (tylko lokalnie)                     waitTimes, today) ──► Plan       │
└───────────────┬────────────────────────────────────────────────────────┘
                │ HTTPS: benefit, province, lat/lng (≈1 km) — zero danych zdrowotnych
                │ „Umów za mnie”: relacja, imię zlecającego, badanie, placówka, godziny
┌───────────────▼──────────────── apps/api (Hono, Node) ─────────────────┐
│ GET /v1/wait-times   GET /v1/facilities   GET /v1/coverage             │
│ GET /v1/health                                                         │
│ POST /v1/call-assist · GET /v1/call-assist/:callId                     │
│ POST /v1/call-assist/:callId/retry-now · …/:callId/cancel              │
│ POST /v1/call-assist/webhook (transkrypcja na żywo z Vapi)             │
│ nfz/client.ts: rate limit · retry · timeout · cache (LRU, TTL 24h)     │
│ fallback: data/snapshot/*.json (nagrane z NFZ, commitowane do repo)    │
└──────┬─────────────────────────────────────────────┬───────────────────┘
       ▼                                             ▼
 api.nfz.gov.pl/app-itl-api (Terminy leczenia)   Vapi (gpt-4o · Deepgram · ElevenLabs)
 uldk.gugik.gov.pl (współrzędne → gmina)         + Twilio → numer testowy DEMO_CALL_TO
```

Bez kluczy Vapi (`VAPI_API_KEY`, `DEMO_CALL_TO` + numer w Vapi albo Twilio) `POST /v1/call-assist` odtwarza symulowaną rozmowę z tym samym przebiegiem (ponowienie, negocjacja terminu, wynik). Numer, pod który dzwoni agent, pochodzi wyłącznie z konfiguracji serwera, nigdy z żądania. Endpointy `/v1/auth/*` i `/v1/sync/*` należą do prototypu synchronizacji rodzinnej (Neon + Drizzle), wyłączonego w wersji demo.

Monorepo pnpm:

| Pakiet | Co robi |
|---|---|
| `apps/mobile` | Aplikacja Expo (iOS, Android, web) |
| `apps/api` | Cienkie proxy do API NFZ (agregacja czasów oczekiwania, cache, fallback na snapshot) + obsługa agenta „Umów za mnie” (Vapi/Twilio albo symulacja) |
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

> `EXPO_PUBLIC_*` trafia do bundla klienta — nigdy nie wpisuj tam sekretów. Aplikacja nie wymaga żadnych kluczy (API NFZ jest publiczne). Klucze Vapi/Twilio dla prawdziwych połączeń agenta są opcjonalne i ustawia się je tylko po stronie API (`apps/api/src/env.ts`); bez nich agent działa w trybie symulacji.

Start (w osobnych terminalach):

```bash
corepack pnpm dev:api
```

```bash
corepack pnpm dev:web
```

Na telefonie: `corepack pnpm dev:mobile` i zeskanuj QR w Expo Go. Wszystko naraz: `corepack pnpm dev`.

> Skrypty w `package.json` wołają `pnpm` bezpośrednio. Jeśli `pnpm` nie jest w `PATH`, uruchom raz `corepack enable` (zmienia globalną konfigurację Node — instaluje shim `pnpm`).

Testy i lint (to samo co CI) — 1013 testów: silnik reguł 206 (100% pokrycia linii), API 174, aplikacja 579, kontrakty 54 (stan na 2026-10-04):

```bash
corepack pnpm check
```

## Źródła danych

- **API NFZ „Terminy leczenia”** — `https://api.nfz.gov.pl/app-itl-api` (publiczne, bez klucza): placówki, średni czas oczekiwania raportowany przez placówki (aktualizacja ok. raz w miesiącu — w aplikacji zawsze „stan na …”). Opis i pułapki: [docs/04-data-sources.md](docs/04-data-sources.md).
- **Zalecenia profilaktyczne** — wyłącznie oficjalne źródła (pacjent.gov.pl, nfz.gov.pl, gov.pl, Dziennik Ustaw), każda reguła z polem `source` i datą weryfikacji; wartości niezweryfikowane aplikacja oznacza jako „orientacyjne”. Weryfikacja z cytatami: [docs/research/exams-verified.md](docs/research/exams-verified.md), mapowanie na świadczenia NFZ: [docs/research/nfz-benefits.md](docs/research/nfz-benefits.md).
- **Mapy** — web: OpenStreetMap przez Leaflet (© współtwórcy OpenStreetMap, licencja ODbL); iOS/Android: mapy systemowe przez `react-native-maps`.

## Ujawnienie użycia AI i zasobów zewnętrznych

Zgodnie z regulaminem HackYeah 2026 ([docs/07](docs/07-pitch-and-submission.md)). Cały kod powstał w trakcie hackathonu: pierwszy commit w repozytorium to dokumentacja koncepcyjna (`docs/`, `AGENTS.md`) z 3.10.2026, 16:32; nie ma w nim kodu sprzed startu wydarzenia.

### Narzędzia AI

| Narzędzie | Do czego użyte |
|---|---|
| **Claude Code** (Anthropic) z modelem **Claude Opus 5.5** | Agenci AI pracujący równolegle w osobnych gałęziach (workstreamy) pod nadzorem zespołu, według zasad z [AGENTS.md](AGENTS.md): generowanie i refaktoryzacja kodu (TypeScript, React Native, Hono), pisanie testów, konfiguracja monorepo; research źródeł (programy NFZ, czasy oczekiwania, konkurencja) z obowiązkiem podania URL; projekt tokenów i makiet z wyliczeniem kontrastu WCAG; szkice dokumentacji, slajdów i skryptu pitchu. Zespół nadzorował pracę agentów, przeglądał i testował każdą zmianę przed scaleniem i odpowiada za cały kod. |

Zasady, których się trzymaliśmy:
- **AI nie generuje zaleceń medycznych.** Przedziały wieku i interwały pochodzą z oficjalnych źródeł z cytatem i URL; reguła bez źródła (nazwa + URL https) i daty weryfikacji nie przechodzi testów (`packages/rules/test/rules-data.test.ts`).
- Każda zmiana przechodzi lint, typecheck i testy (`pnpm check`) przed scaleniem; commity z udziałem AI mają trailer `Co-Authored-By`.
- Zespół rozumie i potrafi wyjaśnić architekturę, algorytm i każdy fragment kodu, także wygenerowany.

### Usługi AI w działającej aplikacji (agent „Umów za mnie”)

Używane tylko wtedy, gdy użytkownik zleci rozmowę i serwer ma skonfigurowane klucze; w wersji demo agent dzwoni wyłącznie na numer testowy zespołu, a bez kluczy odtwarza symulowaną rozmowę (bez żadnej z tych usług). Konfiguracja agenta jest w jednym pliku: `apps/api/src/call-assist/assistant.ts`.

| Usługa | Rola |
|---|---|
| **Vapi** | Orkiestracja agenta głosowego: prowadzi rozmowę, łączy model, rozpoznawanie i syntezę mowy, po rozmowie wyciąga ustalony termin (`booked`, data, godzina) |
| **OpenAI gpt-4o** (przez Vapi) | Model prowadzący rozmowę z rejestracją wg naszego promptu systemowego |
| **Deepgram nova-2** (przez Vapi) | Transkrypcja mowy po polsku |
| **ElevenLabs `eleven_multilingual_v2`** (przez Vapi) | Głos agenta; bez skonfigurowanego głosu ElevenLabs — polski głos neuronowy Microsoft Azure (`pl-PL-ZofiaNeural`) |
| **Twilio** | Telefonia: połączenie z numeru zweryfikowanego (verified caller ID), mostkowane do Vapi przez SIP |

AI w aplikacji **tylko dzwoni i umawia termin** — nie udziela porad medycznych (zakaz w prompcie) i nie wpływa na plan badań. **Zalecenia medyczne nie pochodzą od AI.**

### API i dane
- API NFZ „Terminy leczenia” (`api.nfz.gov.pl/app-itl-api`) — dane publiczne NFZ.
- Treści i dane statystyczne z pacjent.gov.pl, nfz.gov.pl, gov.pl; pełna lista źródeł liczb z prezentacji: [pitch/slides-outline.md](pitch/slides-outline.md).
- OpenStreetMap (ODbL) — kafelki mapy w wersji web.
- NFZ, „Dane o realizacji programów profilaktycznych” (XLSX, stan na 1.10.2026) — objęcie programami przesiewowymi (`apps/api/data/screening/`).
- GUGiK ULDK (`uldk.gugik.gov.pl`) — zamiana współrzędnych (≈ 1 km) na gminę, publiczne, bez klucza.
- Neon (Postgres) + Drizzle ORM — synchronizacja rodzinna; w demo baza testowa.

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
