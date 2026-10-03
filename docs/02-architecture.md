# 02 — Architektura

## Diagram

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

## Struktura monorepo

```
.
├── AGENTS.md / CLAUDE.md / README.md
├── package.json              # skrypty root: dev, lint, typecheck, test, check
├── pnpm-workspace.yaml
├── eslint.config.mjs  ·  .prettierrc  ·  tsconfig.base.json
├── .github/workflows/ci.yml
├── apps/
│   ├── mobile/               # Expo app (iOS, Android, web)
│   │   ├── app/              # expo-router (ekrany)
│   │   └── src/
│   │       ├── theme/        # tokeny: colors, spacing, typography (normal/senior)
│   │       ├── components/   # design system: Button, Card, Chip, Timeline, ...
│   │       ├── features/     # onboarding, profiles, plan, facilities, visit-prep
│   │       ├── store/        # zustand: profiles, records, settings(today override)
│   │       ├── services/     # api client (fetch + Zod), location
│   │       ├── notifications/
│   │       └── i18n/pl.ts
│   └── api/
│       ├── src/{index.ts, routes/, nfz/, aggregate/}
│       ├── data/snapshot/    # fallback danych NFZ
│       ├── scripts/snapshot.ts
│       └── test/{fixtures/, *.test.ts}
└── packages/
    ├── shared/               # typy domenowe + schematy Zod (kontrakty)
    └── rules/                # silnik reguł + data/exams.json + algorytm terminów
```

## Kluczowe decyzje (ADR w skrócie)

| # | Decyzja | Dlaczego | Alternatywa odrzucona |
|---|---|---|---|
| 1 | **Expo + web target** | Jeden kod na telefon (demo na scenie) i web (klikalny link dla jury w fazie 1). Expo Go = zero konfiguracji na telefonach zespołu. | Flutter (mniej osób zna), czysty web (słabszy „mobile feel”, brak powiadomień) |
| 2 | **Dane zdrowotne tylko lokalnie, bez kont** | Art. 9 RODO — dane szczególnej kategorii. Brak backendu z danymi = brak problemu regulacyjnego i argument do pitchu. | Supabase z auth (czas, ryzyko, RODO) |
| 3 | **Silnik reguł jako czysty pakiet TS + JSON** | Testowalny w izolacji, otwarty i audytowalny (każda reguła ze źródłem), działa offline w aplikacji. | Reguły na backendzie, reguły przez LLM (nieprzewidywalne, niebezpieczne medycznie) |
| 4 | **Cienkie API-proxy do NFZ** | NFZ ma rate limit (zweryfikowane — przy serii zapytań przestaje zwracać JSON), część pól jest pusta → trzeba agregować i cache'ować. | Wołanie NFZ z aplikacji |
| 5 | **Snapshot fallback w repo** | Demo nie może paść, gdy NFZ/Wi-Fi na hali zawiedzie. | — |
| 6 | **Lokalne powiadomienia** (`expo-notifications`, trigger datą) | Bez serwera push, bez tokenów urządzeń. Przeliczanie przy otwarciu aplikacji. | Push z backendu (wymaga kont) |
| 7 | **`today` jako parametr wszędzie** | Testy deterministyczne + tryb „przewiń czas” na demo. | `new Date()` w logice |
| 8 | **Mapa: `react-native-maps` (native) + `react-leaflet` (`.web.tsx`)** | `react-native-maps` nie działa na web; Leaflet + OSM bez klucza API. | MapLibre RN (brak web), Google Maps JS (klucz) |

## Deploy

- **API:** Railway / Render / Fly (Node) — jeden serwis, zmienne środowiskowe w panelu. Healthcheck `/v1/health`.
- **Web:** `npx expo export -p web` → Vercel/Netlify (static). `EXPO_PUBLIC_API_URL` wskazuje na API.
- **Mobile demo:** Expo Go (QR) na telefonach; na scenie mirroring ekranu. Zapas: nagrane wideo demo.

## Bezpieczeństwo i prywatność (checklista)

- [ ] API przyjmuje tylko: `benefit`, `province`, `lat`, `lng`, `radiusKm`, `case` — walidacja Zod, whitelisting `benefit` z naszego słownika
- [ ] Współrzędne zaokrąglane do 2 miejsc po przecinku po stronie klienta
- [ ] CORS ograniczony do domeny web + `localhost`
- [ ] Brak logowania współrzędnych; rate limit per IP na naszym API
- [ ] Brak sekretów w repo (API NFZ nie wymaga klucza)
