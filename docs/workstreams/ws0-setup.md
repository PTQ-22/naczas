# WS0 — Setup & integracja

**Właściciel:** _____ · **Katalogi:** root config, `packages/shared`, `.github/`
**Blokuje wszystkich** — cel: M0 w ≤ 2h od startu. Potem: integrator i strażnik `main`.

Czytaj: `AGENTS.md`, `docs/02-architecture.md`, `docs/03-contracts.md`.

## Zadania

### WS0-1 · Scaffold monorepo (≤ 45 min)
- [ ] `pnpm-workspace.yaml` (`apps/*`, `packages/*`), `tsconfig.base.json` (`strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes: false`)
- [ ] `apps/mobile`: `npx create-expo-app@latest` (template z expo-router, TS), nazwa pakietu `@naczas/mobile`; potwierdź, że startuje w Expo Go **i** `--web`
- [ ] `apps/api`: Hono + `@hono/node-server`, `tsx` do dev, `@naczas/api`
- [ ] `packages/shared`, `packages/rules`: TS, `vitest`, eksport przez `exports` w `package.json` (źródła TS, bez builda — Metro i tsx czytają TS bezpośrednio; skonfiguruj `metro.config.js` pod monorepo)
- [ ] Skrypty root: `dev`, `dev:mobile`, `dev:web`, `dev:api`, `lint`, `lint:fix`, `typecheck`, `test`, `check` (patrz `AGENTS.md` §2)
- [ ] **Preinstalacja zależności** (żeby inni agenci nie ruszali lockfile'a):
  - mobile: `zustand @react-native-async-storage/async-storage zod date-fns expo-notifications expo-location expo-print expo-sharing expo-linking react-native-maps react-leaflet leaflet react-native-reanimated @react-native-community/datetimepicker` + dev: `jest-expo @testing-library/react-native @types/leaflet`
  - api: `hono @hono/node-server zod p-queue date-fns` + dev: `tsx vitest`
  - shared/rules: `zod date-fns` + dev: `vitest @vitest/coverage-v8`
- [ ] **Wszystkie pliki routingu** z `docs/01-user-journey.md` jako cienkie wrappery: `export { default } from '@/features/<feature>/<Screen>'` + placeholder `<Screen>` w `src/features/<feature>/` (zwraca tytuł ekranu)
- [ ] `src/i18n/pl/index.ts` łączący pliki `onboarding.ts`, `profiles.ts`, `plan.ts`, `exam.ts`, `facilities.ts`, `visitPrep.ts`, `settings.ts`, `common.ts` (puste obiekty) + typowany helper `t()`

**Akceptacja:** `pnpm install && pnpm check` zielone; `pnpm dev:web` pokazuje ekran startowy; `curl localhost:8787/v1/health` → `{ ok: true }`.

### WS0-2 · Lint, format, CI (≤ 30 min)
- [ ] `eslint.config.mjs`: `typescript-eslint` recommended-type-checked, `eslint-config-expo` dla `apps/mobile`, `eslint-plugin-import` (`import/no-cycle`, `import/order`), `--max-warnings 0`
- [ ] Reguły: `@typescript-eslint/no-explicit-any: error`, `@typescript-eslint/ban-ts-comment` (pozwól `ts-expect-error` z opisem), `no-console: warn` (poza `apps/api`)
- [ ] `.prettierrc` (`singleQuote`, `printWidth: 100`), `.editorconfig`
- [ ] `lint-staged` + `simple-git-hooks`: pre-commit `eslint --fix` + `prettier --write` na zmienionych plikach
- [ ] `.github/workflows/ci.yml`: Node LTS, pnpm cache, `pnpm install --frozen-lockfile`, `pnpm check`
- [ ] `.env.example` (`EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_USE_MOCKS`, `PORT`, `CORS_ORIGINS`)

**Akceptacja:** PR z celowym `any` pada w CI.

### WS0-3 · Kontrakty w `packages/shared` (≤ 45 min)
- [ ] Przenieś typy z `docs/03-contracts.md` jako schematy Zod (`domain.ts`, `rules.ts`, `plan.ts`, `api.ts`), typy przez `z.infer`
- [ ] Testy: parsowanie przykładowego `Profile`, `FacilitiesResponse`, odrzucenie błędnego
- [ ] `index.ts` z eksportami; zero zależności poza `zod`

**Akceptacja:** WS1–WS4 importują `@naczas/shared` bez błędów typów. **→ M0**

### WS0-4 · Deploy (od T+10)
- [ ] API na Railway/Render (healthcheck, `CORS_ORIGINS`)
- [ ] Web: `expo export -p web` → Vercel; `EXPO_PUBLIC_API_URL` produkcyjny
- [ ] Sprawdź, że web build działa z telefonu (link dla jury)

### WS0-5 · Integracja (T+12 – T+16)
- [ ] Wyłącz mocki, podłącz prawdziwe API i silnik
- [ ] Przejdź scenariusz demo z `docs/01-user-journey.md` na iOS, Android, web — zgłaszaj bugi do właścicieli WS
- [ ] Tag `demo-v1` na commicie, który przechodzi scenariusz. **→ M3**
