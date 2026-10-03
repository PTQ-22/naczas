# WS2 — API NFZ

**Właściciel:** _____ · **Katalogi:** `apps/api`
Czytaj: `AGENTS.md` (§3 API, §8), `docs/03-contracts.md` §API, `docs/04-data-sources.md` §A, `docs/05-scheduling-algorithm.md` §3.

## Struktura

```
apps/api/
├── src/
│   ├── index.ts              # Hono app, CORS, error handler, routes
│   ├── routes/{health,wait-times,facilities}.ts
│   ├── nfz/
│   │   ├── client.ts         # fetch + kolejka ≤1 req/s + retry/backoff + timeout 8s
│   │   ├── schemas.ts        # Zod dla surowych odpowiedzi NFZ (luźne: passthrough, nullable)
│   │   ├── cache.ts          # LRU in-memory, TTL 24h, klucz: benefit+province+case
│   │   └── snapshot.ts       # odczyt data/snapshot/<province>/<benefit>.json
│   ├── aggregate/
│   │   ├── geo.ts            # haversine, rozszerzanie promienia
│   │   ├── normalize.ts      # NFZ queue → Facility
│   │   └── wait-times.ts     # p50/p75/min
│   └── env.ts                # walidacja env przez Zod
├── scripts/snapshot.ts       # pobiera wszystkie (benefit × province) → data/snapshot
├── data/snapshot/
└── test/{fixtures/, *.test.ts}
```

## Zadania

### WS2-1 · Fixtures z prawdziwego NFZ (T+0, ≤ 45 min — odblokowuje mocki WS3/WS4)
- [ ] Skrypt pobierający `/queues` dla `KOLONOSKOPIA`, `PORADNIA STOMATOLOGICZNA`, okulistyka — woj. `06` i `07`, wszystkie strony (z przerwą ≥ 1 s między requestami)
- [ ] Zapisz do `test/fixtures/` (surowe) — commit
- [ ] Zanotuj w PR obserwacje o danych (odsetek `dates: null` itp.)

### WS2-2 · NFZ client
- [ ] Kolejka requestów (`p-queue` lub własna), retry ×3 z exponential backoff, rozpoznanie odpowiedzi nie-JSON jako rate limit
- [ ] Paginacja (`links.next`), łączenie stron
- [ ] Walidacja Zod surowej odpowiedzi (tolerancyjna — nie wywalaj się na nowych polach)
- [ ] Testy z mockiem `fetch` (fixtures): paginacja, retry, rate limit → fallback

### WS2-3 · Normalizacja + agregacja
- [ ] `normalize.ts`: NFZ → `Facility` (Y/N → boolean, `waitDays`, `asOf`)
- [ ] `wait-times.ts`: odfiltrowanie pustych, p50/p75/min, rozszerzanie promienia 15 → 30 → 60 → województwo (min. 3 placówki)
- [ ] Testy jednostkowe na fixtures (konkretne oczekiwane liczby)

### WS2-4 · Endpointy
- [ ] `GET /v1/health`, `GET /v1/wait-times`, `GET /v1/facilities` wg kontraktu
- [ ] `examId` → `nfzBenefits` przez `@naczas/rules`; nieznany `examId` → 400
- [ ] Sortowanie `soonest` (nulle na końcu) / `nearest`
- [ ] Testy przez `app.request()`: happy path, 400 walidacja, fallback na snapshot przy padniętym NFZ

### WS2-5 · Snapshot fallback
- [ ] `scripts/snapshot.ts`: wszystkie `nfzBenefits` z reguł × 16 województw → `data/snapshot/` (uruchomić raz, commit; to ~kilkaset requestów — puszczać w tle z throttlingiem)
- [ ] Kolejność: cache → live NFZ → snapshot; pole `source` w odpowiedzi

### WS2-6 · Hardening & deploy (z WS0)
- [ ] CORS z `CORS_ORIGINS`, rate limit per IP (np. 60/min), logi bez współrzędnych
- [ ] Prefetch przy starcie serwera dla najpopularniejszych województw (rozgrzanie cache)

## Definition of Done (WS2)
`pnpm --filter @naczas/api check` zielone, zero prawdziwych requestów w testach, `/v1/facilities` odpowiada < 500 ms z cache, działa przy odłączonym internecie (snapshot).
