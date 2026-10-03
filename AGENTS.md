# AGENTS.md — zasady pracy (ludzie + agenci AI)

Ten plik obowiązuje każdego, kto pisze kod w tym repo — człowieka i agenta (Claude Code, Cursor, Copilot itd.).
Agent: przeczytaj go w całości, potem brief swojego workstreamu w `docs/workstreams/`, potem `docs/03-contracts.md`.

---

## 1. Złote zasady

1. **`main` zawsze da się zdemować.** Nic nie trafia na `main`, jeśli `pnpm check` nie przechodzi.
2. **Pracuj tylko w swoich katalogach** (tabela w §6). Zmiana poza nimi = osobny, mały PR z opisem i pingiem do właściciela.
3. **Kontrakty są święte.** Typy w `packages/shared` i kształt endpointów z `docs/03-contracts.md` zmienia się tylko przez PR, który aktualizuje jednocześnie dokument, typy i wszystkich konsumentów. Nie „dopasowuj” kontraktu po cichu do swojej implementacji.
4. **Małe kroki.** PR < ~400 linii diffu (bez lockfile'ów i snapshotów). Lepiej trzy małe niż jeden wielki.
5. **Nie zgaduj — zapytaj.** Niejasny wymóg → pytanie w kanale zespołu / do człowieka-właściciela, zamiast wymyślania.
6. **Rozumiemy, co oddajemy.** Regulamin: zespół musi umieć wyjaśnić każdą decyzję techniczną, także kod wygenerowany przez AI. Agent: przy nieoczywistym rozwiązaniu dodaj krótki komentarz *dlaczego* (nie *co*).

## 2. Komendy (root repo)

```bash
pnpm install          # instalacja
pnpm dev              # mobile (Expo) + api równolegle
pnpm dev:mobile       # tylko Expo
pnpm dev:web          # Expo web
pnpm dev:api          # tylko API
pnpm lint             # ESLint (cały monorepo)
pnpm lint:fix         # ESLint --fix + Prettier
pnpm typecheck        # tsc --noEmit we wszystkich pakietach
pnpm test             # Vitest / jest-expo
pnpm check            # lint + typecheck + test — OBOWIĄZKOWE przed commitem/PR
```

Agent: **po każdej zakończonej zmianie uruchom `pnpm check`** (lub zawężone `pnpm --filter <pakiet> check`) i nie raportuj zadania jako skończonego, dopóki nie przechodzi. Jeśli test był czerwony przed Twoją zmianą — napisz to wprost, nie wyłączaj go.

## 3. Jakość kodu

### TypeScript
- `strict: true`, bez wyjątków. **Zakaz `any`** (użyj `unknown` + zawężenie). Zakaz `@ts-ignore`; `@ts-expect-error` tylko z komentarzem dlaczego.
- Dane z zewnątrz (API NFZ, AsyncStorage, parametry URL) **zawsze walidowane Zod** na granicy. Wewnątrz aplikacji ufamy typom.
- Typy domenowe importuj z `@naczas/shared`, nie duplikuj.
- Funkcje czyste tam, gdzie się da (silnik reguł, algorytm terminów, formatowanie). Daty jako ISO string `YYYY-MM-DD` w modelu; obliczenia przez `date-fns`. Nigdy `new Date()` w logice domenowej — przekazuj `today` jako argument (testowalność + tryb „przewiń czas” na demo).

### Lint i format
- ESLint flat config (`eslint.config.mjs` w root): `typescript-eslint` (recommended-type-checked), `eslint-config-expo` dla mobile, `eslint-plugin-import` (sortowanie, brak cykli).
- Prettier: domyślny + `singleQuote`, `printWidth: 100`. Nie dyskutujemy o formatowaniu — robi to narzędzie.
- Zero warningów na `main` (`--max-warnings 0`). `eslint-disable` tylko z komentarzem dlaczego, dla pojedynczej linii.

### Nazewnictwo i struktura
- Kod, identyfikatory, commity: **angielski**. Teksty UI: **polski**, wyłącznie w `apps/mobile/src/i18n/pl/<feature>.ts` (żadnych stringów UI wpisanych w komponenty).
- Pliki komponentów `PascalCase.tsx`, reszta `kebab-case.ts`. Jeden komponent eksportowany na plik.
- Komponenty specyficzne dla platformy: `Foo.tsx` + `Foo.web.tsx` (np. mapa).

### React Native / Expo
- Expo SDK (najnowsze stabilne), `expo-router`. **Musi działać w Expo Go i na web** — nie dodawaj bibliotek wymagających dev builda bez zgody zespołu (wyjątek: stretch Health Connect, na osobnym branchu).
- Stan: `zustand` + `persist` (AsyncStorage). Żadnego Reduxa.
- Style: tokeny z `apps/mobile/src/theme` (kolory, spacing, typografia). Zakaz hardkodowanych kolorów i rozmiarów w komponentach.
- Dostępność (kryterium jury!): każdy klikalny element ma `accessibilityRole` i `accessibilityLabel`; min. obszar dotyku 44×44; kontrast WCAG AA; wspieraj systemowe powiększenie czcionki (nie blokuj `allowFontScaling`). Tryb senior = większa typografia z tokenów, nie osobne komponenty.

### API (Hono)
- Każdy endpoint: walidacja wejścia (Zod), typowana odpowiedź z `@naczas/shared`, obsługa błędów zwracająca `{ error: { code, message } }`.
- Wywołania NFZ tylko przez `apps/api/src/nfz/client.ts` (rate limit, retry z backoffem, timeout, cache). Nigdy bezpośrednio z endpointu.
- Snapshot fallback: gdy NFZ nie odpowiada, serwujemy dane z `apps/api/data/snapshot/` i oznaczamy `source: "snapshot"`. **Demo nie może zależeć od dostępności NFZ.**

## 4. Testy

| Warstwa | Narzędzie | Wymóg |
|---|---|---|
| `packages/rules` (silnik reguł, algorytm terminów) | Vitest | **Obowiązkowe.** Każda reguła badania = min. 1 test pozytywny i 1 negatywny. Pokrycie ≥ 90% linii. |
| `packages/shared` (schematy Zod) | Vitest | Test parsowania przykładowego payloadu i odrzucenia błędnego. |
| `apps/api` | Vitest + `app.request()` Hono | Każdy endpoint: happy path + błąd walidacji + fallback na snapshot. NFZ **mockowany** (fixtures w `apps/api/test/fixtures/` nagrane z prawdziwego API). Testy nie robią prawdziwych requestów sieciowych. |
| `apps/mobile` | jest-expo + React Native Testing Library | Logika store'ów i hooków: obowiązkowo. Komponenty: tylko krytyczne (onboarding → plan). Bez snapshot testów całych ekranów. |
| E2E | ręczny scenariusz z `docs/01-user-journey.md` §Demo | Przed każdym merge'em do `main` w fazie integracji. |

Zasady:
- Bug fix = najpierw test, który go odtwarza.
- Testy deterministyczne: stała data `today`, brak sieci, brak losowości.
- Nie usuwaj ani nie skipuj cudzego testu, żeby przeszedł CI. Jeśli test jest błędny — napisz to w PR.

## 5. Git i PR

- Branch: `ws<N>/<krótki-opis>`, np. `ws2/nfz-cache`. Trunk-based: rebase na `main` często, merge szybko.
- Commity: **Conventional Commits** — `feat(rules): add colonoscopy rule`, `fix(api): handle null dates`, `test(...)`, `chore(...)`, `docs(...)`. Scope = nazwa pakietu.
- Commit z udziałem agenta: dopisz trailer `Co-Authored-By: <model> <...>` (potrzebne do ujawnienia użycia AI w zgłoszeniu).
- PR: opis *co* i *dlaczego*, jak przetestowano, screenshot/gif przy zmianach UI. Review przez min. 1 osobę z innego WS (w ostatnich 3h: self-merge dozwolony, jeśli CI zielone).
- CI (GitHub Actions): `pnpm install --frozen-lockfile && pnpm check` na każdy PR. Czerwone CI = brak merge'a.
- **Nigdy** nie commituj sekretów, `.env`, danych osobowych. Do repo idzie tylko `.env.example`.

## 6. Własność katalogów

| Katalog | Właściciel |
|---|---|
| `packages/shared` | WS0 (setup) → potem wspólny, zmiany przez PR z review WS1+WS2+WS3 |
| `packages/rules` | WS1 |
| `apps/api` | WS2 |
| `apps/mobile/src/{store,services,features/onboarding,features/profiles,notifications}` | WS3 |
| `apps/mobile/src/{theme,components,features/plan,features/facilities,features/visit-prep}` | WS4 |
| `apps/mobile/app/` (routing expo-router) | WS3 (struktura) + WS4 (ekrany) — koordynacja |
| `docs/`, `pitch/`, `README.md` | WS5 |
| Root config (`eslint`, `tsconfig`, CI) | WS0 |

### Praca równoległa wielu agentów — zasady anty-konfliktowe

- **Każdy agent = osobny git worktree + osobny branch.** Nigdy dwóch agentów w jednym katalogu roboczym (nawzajem psują sobie `pnpm check` i pliki).
- **Zależności:** WS0 instaluje z góry wszystkie przewidywane paczki (lista w `docs/workstreams/ws0-setup.md`). Dodanie nowej zależności = zapytaj człowieka; po rebase z konfliktem w `pnpm-lock.yaml` → weź wersję z `main` i uruchom `pnpm install`, nie edytuj lockfile'a ręcznie.
- **Routing:** pliki w `apps/mobile/app/` tworzy WS0 jako cienkie wrappery (`export { default } from '@/features/plan/PlanScreen'`). Ekrany implementuje się w `src/features/**`, nie w `app/`.
- **i18n:** każdy feature ma własny plik `src/i18n/pl/<feature>.ts`; `src/i18n/pl/index.ts` (WS0) tylko je łączy. Nie edytuj cudzego pliku i18n.
- Rebase na `main` przed każdym PR i co ~2h.

## 7. Treści medyczne — zasady bezpieczeństwa

- Aplikacja **edukuje i przypomina, nie diagnozuje ani nie leczy**. Żadnych sformułowań typu „masz ryzyko raka X”. Zamiast tego: „Ze względu na wiek i historię rodzinną zalecane jest…”.
- Każde zalecenie w `packages/rules/data/*.json` musi mieć pole `source` (nazwa programu / wytycznej + URL) i `verifiedAt`. Reguła bez źródła nie przechodzi testów (jest na to test).
- Agent **nie wymyśla** interwałów, przedziałów wieku ani progów. Jeśli brak zweryfikowanej wartości — zostaw `"verified": false` i dodaj do listy w `docs/04-data-sources.md` §Do weryfikacji.
- Disclaimer widoczny w onboardingu i na karcie każdego badania.
- LLM (jeśli użyty) wyłącznie do upraszczania opisu badania na podstawie naszej treści — nigdy do generowania zaleceń.

## 8. Prywatność

- Dane zdrowotne (profil, historia, czynniki ryzyka) **tylko na urządzeniu**. Do API wysyłamy wyłącznie: nazwę świadczenia, województwo, współrzędne (zaokrąglone do 2 miejsc ≈ 1 km).
- Żadnych danych w query stringach poza powyższymi. Brak analityki zbierającej dane zdrowotne. Logi API bez współrzędnych użytkownika.

## 9. Definition of Done

Zadanie jest skończone, gdy:
- [ ] `pnpm check` zielone lokalnie i w CI
- [ ] testy dla nowej logiki dopisane (wg §4)
- [ ] zgodne z kontraktem w `docs/03-contracts.md` (lub kontrakt zaktualizowany w tym samym PR)
- [ ] UI: działa na iOS/Android (Expo Go) **i** web; sprawdzone w trybie senior (duża czcionka) i dark mode
- [ ] brak stringów UI poza `i18n/pl.ts`, brak hardkodowanych kolorów
- [ ] checkbox w briefie workstreamu odhaczony

## 10. Instrukcja dla agenta — jak zacząć zadanie

1. Przeczytaj: ten plik → `docs/workstreams/<twój-WS>.md` → `docs/03-contracts.md` → powiązane dokumenty linkowane w briefie.
2. Weź **pierwsze nieodhaczone zadanie** z briefu. Jedno zadanie = jeden branch = jeden PR.
3. Zanim zaczniesz kodować: napisz w 3–5 punktach plan i jakie pliki zmienisz. Jeśli wychodzisz poza swoje katalogi — zatrzymaj się i zapytaj.
4. Najpierw test (dla logiki), potem implementacja.
5. `pnpm check`. Napraw wszystko, co zepsułeś.
6. Raport końcowy: co zrobione, jak przetestowano, co zostało / ryzyka. Bez upiększania — jeśli coś nie działa, powiedz to.
