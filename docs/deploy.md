# Deploy — API (Render) + web (Vercel)

Konfiguracja jest w repo: `Dockerfile`, `.dockerignore`, `render.yaml` (API) oraz `vercel.json` (web).
Logowanie do serwisów i klikanie w panelach robi **człowiek**. Agent przygotował tylko pliki i przetestował je lokalnie.
Nazwy przycisków w panelach mogą się trochę różnić od opisanych, bo serwisy zmieniają UI.

Kolejność ma znaczenie: **API → web → CORS w API**. Web potrzebuje adresu API, a API musi znać adres webu.

## 0. Przed startem

- [ ] `main` jest zielony w CI i zawiera `apps/api/data/snapshot/` (64 pliki `.jsonl`).
- [ ] Opcjonalnie sprawdź obraz lokalnie (Docker Desktop):

```bash
docker build -t naczas-api .
```

```bash
docker run --rm -p 8787:8787 -e REFRESH_ON_START=false naczas-api
```

Potem w drugim terminalu `curl localhost:8787/v1/health` → `{"ok":true,…}`.

## 1. API na Render (darmowy plan)

1. Zaloguj się na https://render.com (najprościej kontem GitHub).
2. **New → Blueprint**. Połącz GitHub i daj Renderowi dostęp do prywatnego repo `PTQ-22/naczas`.
3. Wybierz repo i branch `main`. Render wczyta `render.yaml` i pokaże usługę `naczas-api` (Docker, plan Free, Frankfurt).
4. Render zapyta o zmienną `CORS_ORIGINS`. Na razie wpisz `http://localhost:8081`, docelowy adres uzupełnisz w kroku 3.
5. **Apply**. Pierwszy build trwa kilka minut.
6. Gdy status jest **Live**, skopiuj adres usługi (np. `https://naczas-api.onrender.com`) i sprawdź:
   - `https://<adres>/v1/health` → `{"ok":true,"nfz":"up","snapshotAsOf":"2026-10-03"}`
   - `https://<adres>/v1/wait-times?examId=colonoscopy_screening&province=07` → JSON z `p50Days`

Zmienne ustawione przez `render.yaml`: `NODE_ENV=production`, `TRUST_PROXY=true`, `REFRESH_ON_START=true`, `RATE_LIMIT_PER_MIN=60`. `PORT` ustawia sam Render.

## 2. Web na Vercel

1. Zaloguj się na https://vercel.com (kontem GitHub) i daj dostęp do `PTQ-22/naczas`.
2. **Add New → Project** → wybierz `naczas`.
3. **Root Directory:** zostaw katalog główny repo (`./`). Build, install i katalog wyjściowy są w `vercel.json`. Framework: *Other*.
4. **Environment Variables** (Production):
   - `EXPO_PUBLIC_API_URL` = adres API z kroku 1, bez ukośnika na końcu
   - `EXPO_PUBLIC_USE_MOCKS` = `false`
   - `ENABLE_EXPERIMENTAL_COREPACK` = `1` (Vercel użyje wtedy pnpm w wersji z `packageManager` w `package.json`)
5. **Deploy**. Skopiuj adres produkcyjny, np. `https://naczas.vercel.app`.

`EXPO_PUBLIC_*` jest wkompilowane w bundle podczas builda. Po zmianie zmiennej trzeba zrobić **Redeploy**.

## 3. CORS: wpuść web do API

1. Render → `naczas-api` → **Environment** → `CORS_ORIGINS` = adres z Vercela, np. `https://naczas.vercel.app`.
   Kilka adresów oddziel przecinkiem (np. domena produkcyjna i adres preview).
2. **Save changes** (Render zrestartuje usługę).

## 4. Sprawdzenie końcowe

- [ ] Otwórz adres z Vercela na telefonie (to link dla jury). Wejdź też bezpośrednio na podstronę, np. `/plan`. Ma się wczytać, a nie pokazać 404.
- [ ] W DevTools → Network zapytania do API mają status 200 i nie ma błędów CORS w konsoli.
- [ ] `/v1/health` na API zwraca `snapshotAsOf`.

## 5. Nie pozwól Renderowi zasnąć (keepalive)

Workflow `.github/workflows/keepalive.yml` co 10 min odpytuje `/v1/health`, żeby darmowa usługa się nie usypiała. Działa tylko wtedy, gdy w repo jest ustawiona zmienna `API_URL`:

1. GitHub → repo `PTQ-22/naczas` → **Settings → Secrets and variables → Actions**.
2. Zakładka **Variables** (nie *Secrets*) → **New repository variable**.
3. Name: `API_URL`, Value: adres API z kroku 1, np. `https://naczas-api.onrender.com`, bez ukośnika na końcu.
4. **Actions → Keep API awake → Run workflow**, żeby sprawdzić od razu. Krok `GET /v1/health` ma być zielony.

Usunięcie zmiennej wyłącza pingowanie (job się pomija). Darmowy plan Rendera ma 750 h/mies., więc jedna usługa działająca bez przerwy się w nim mieści.

## 6. Smoke test po deployu

```bash
./scripts/smoke.sh https://naczas-api.onrender.com https://naczas.vercel.app
```

Sprawdza health, `wait-times` (kolonoskopia, woj. 07; ze snapshotu oczekiwane p75 = 213), `facilities` (Warszawa), 400 dla badania programowego oraz SPA fallback (`/` i `/plan`). Wymaga `curl` i `jq`. Kod wyjścia to liczba nieudanych kroków.

## Uwagi do demo

- **Darmowy Render usypia usługę po ~15 min bez ruchu.** Pierwsze zapytanie po uśpieniu czeka ~1 min na start. Zapobiega temu keepalive (krok 5). Bez niego **2–3 min przed pokazem otwórz `/v1/health`**, żeby obudzić API.
  Po starcie dane są od razu dostępne ze snapshotu. W tle API przez ~10 min odświeża je z NFZ (ok. 600 zapytań, 1/s).
  Jeśli NFZ nie odpowiada, API cały czas działa na snapshocie (`source: "nfz_snapshot"`).
- Aktualizacja snapshotu: lokalnie `pnpm --filter @naczas/api snapshot --force` (~15 min), commit, push. Render zbuduje nową wersję sam.
- Wycofanie wersji: Render → **Deploys** → wybierz poprzedni → **Rollback**; Vercel → **Deployments** → poprzedni → **Promote to Production**.
- Sekretów nie ma: API NFZ nie wymaga klucza. Nie wpisuj niczego wrażliwego do `EXPO_PUBLIC_*`, bo trafia do przeglądarki.
