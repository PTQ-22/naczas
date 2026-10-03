# Realizatorzy programów profilaktycznych NFZ — źródła danych i plan

Stan na: **2026-10-03 (22:50–23:05 CEST)**. Wszystkie kody, pola i liczby poniżej pochodzą z odpowiedzi, które faktycznie pobrano (≈ 53 zapytania, ≥ 3 s odstępu). Próbki: `docs/research/nfz-programs-samples/`.

## TL;DR

- **Da się pokazać listę „Realizatorzy programu w okolicy”** dla: mammografii, testu HPV HR / cytologii i kolonoskopii w programie przesiewowym. Źródło, które dziś działa i zwraca dane na poziomie **konkretnej pracowni** (nazwa świadczeniodawcy, nazwa pracowni, adres, telefon do rejestracji, czasem WWW), to wyszukiwarka NFZ **„Gdzie się leczyć — programy profilaktyczne”** (`gsl.nfz.gov.pl`). Zwraca ona **HTML, nie JSON**.
- **Współrzędne: prawie zawsze brak.** GSL ma ukryte pola `lat`/`long`, ale wypełnione w 1/61 (mammografia) i 2/37 (kolonoskopia) rekordach w woj. mazowieckim. Trzeba geokodować adres, np. oficjalną usługą GUGiK UUG (działa, zwraca WGS84) — patrz §4.
- **Rak płuca (LDCT): na dziś brak danych.** Słownik programów w GSL nie zawiera jeszcze programu raka płuca (NFZ zapowiada wyszukiwarkę od II poł. października 2026).
- **„Moje Zdrowie”** jest w słowniku GSL (kod 2122), ale realizuje go własna POZ pacjenta. Poza zakresem, zgodnie z założeniem.
- **API „Umowy” NFZ (`app-umw-api`) przez cały czas badania odpowiadało `503 Maintenance`** na wszystkich endpointach z danymi (działał tylko `/version`). Zbadano tylko kontrakt (Swagger v1.2). Z niego wynika, że **nawet gdy API działa, zwraca ono dane świadczeniodawcy jako podmiotu** (adres siedziby, telefon, gmina), **nie miejsca udzielania świadczeń, i bez współrzędnych**. **Kodów rodzaju świadczenia ani produktów dla programów nie udało się ustalić** — `service-types` i `contract-products` zwracały 503.
- **Czas oczekiwania / dostępność dla programów: brak w żadnym sprawdzonym oficjalnym źródle.** ITL nie obejmuje programów, GSL i UMW nie mają terminów. dane.gov.pl ma tylko statystyki wykonania (agregaty).
- ⚠️ **`https://gsl.nfz.gov.pl/robots.txt` = `User-agent: *` / `Disallow: /`.** Automatyczne pobieranie GSL jest sprzeczne z deklarowaną polityką serwisu. Rekomendacja w §5 to jednorazowy, mały snapshot demo (lub tylko deep-link) i decyzja zespołu. Nie budujemy scrapera „na żywo”.

## 1. Źródła — co sprawdzono

| Źródło | Format | Poziom danych | Współrzędne | Aktualność | Status 2026-10-03 |
|---|---|---|---|---|---|
| GSL „Programy profilaktyczne” `https://gsl.nfz.gov.pl/GSL/GSL/ProgramyProfilaktyczne` | HTML (AJAX, 10 kart/strona) + słownik JSON | miejsce (pracownia/poradnia) | pola `lat`/`long` są, ale prawie zawsze puste | na żywo (wydruk „na dzień: 03.10.2026 22:52”) | działa |
| API Umowy `https://api.nfz.gov.pl/app-umw-api` | JSON API (Swagger v1.2) | umowa / świadczeniodawca (podmiot) | brak w schemacie | parametr `year`; dostępnych lat nie dało się sprawdzić | **503 Maintenance** (`error-code` 4200003) |
| API ITL `app-itl-api` | JSON | miejsce + kolejka | tak | miesięczne | działa, ale **bez programów** (patrz `docs/04-data-sources.md`) |
| Harmonogramy mammobusów (16 stron oddziałów wojewódzkich, linkowane z https://www.nfz.gov.pl/dla-pacjenta/programy-profilaktyczne/mammobusy/) | HTML, każdy oddział w innym układzie (np. Mazowsze: rozwijane sekcje per powiat) | postój (miejscowość, data) | brak | ręcznie aktualizowane | tylko HTML, nie nadaje się do automatu w 1–2 h |
| dane.gov.pl (`https://api.dane.gov.pl/1.4/search`) | API katalogu | — | — | — | „mammobus” → 0 wyników. Są tylko **statystyki** (np. „Realizacja mammografii przesiewowej”, dataset 2584; „Liczba wykonanych badań profilaktycznych w latach 2023–2024”, resource 65841). Listy realizatorów programów NFZ brak. „Wykaz realizatorów Programu polityki zdrowotnej MZ 2022–2026” (resource 1829529) dotyczy leczenia HIV — nie nasz temat. |
| GUGiK UUG (geokoder) `https://services.gugik.gov.pl/uug/` | JSON | punkt adresowy | tak (`srid=4326`) | PRG | działa |

## 2. GSL — jak pytać (zweryfikowane)

1. Słownik programów (JSON): `GET https://gsl.nfz.gov.pl/GSL/Dictionary/ZakresyAll?kod_typ=19` → `[{Kod, Nazwa, Komentarz}]` (próbka: `gsl-dictionary-programy.json`). Pełna lista z 2026-10-03:
   `1245` Badania prenatalne · `1081` Kolonoskopia · `2122` Moje zdrowie · `1244` Profilaktyka chorób odtytoniowych · `1285` Profilaktyka chorób układu krążenia · `1286` Profilaktyka gruźlicy · `1243` Profilaktyka raka piersi · `1242` Profilaktyka raka szyjki macicy. **Raka płuca brak.**
2. Wyszukiwanie (HTML, pierwsza strona + ustawienie sesji):
   `GET https://gsl.nfz.gov.pl/GSL/GSL/ProgramyProfilaktyczneSearch?specjalizacja=<Kod>&wojewodztwo=<01..16>&powiat=&miejscowosc=&ulica=&nazwa=`
   Kody województw są takie same jak w ITL (`07` = mazowieckie). Opcjonalnie `powiat` (4 cyfry TERYT, np. `0264` Wrocław — z `<select>` na stronie). Odpowiedź zawiera „Znaleziono N wyników”.
3. Kolejne strony: `GET …/GSL/GSL/ProgramyProfilaktycznePage?Page=<n>&PageSize=10&ShowProgress=True&TotalCount=<N>`. **Wymaga ciasteczka sesji** z kroku 2 (bez niego strona nie wie, czego szukano). `PageSize=100` jest ignorowane — zawsze 10 kart.
4. Pola na karcie (z HTML, parser w ~30 liniach): `provider` (nazwa podmiotu), `place` (nazwa pracowni/poradni), `address` (np. `ul.KOSZYKOWA 78, 00-911 Śródmieście` — **w Warszawie zamiast miasta jest dzielnica**), `phoneRegistration`, `phoneInfo`, `website` (rzadko), godziny otwarcia, udogodnienia (winda, podjazd itd.), lista programów miejsca, ukryte `lat`/`long` (format `52,21967100`). **Brak kodu świadczeniodawcy, REGON-u czy identyfikatora miejsca** → nie da się zrobić joinu po kluczu z ITL/UMW, tylko po nazwie i adresie.

### Tabela per badanie

| examId | program | jak pytać | wynik woj. 07 (2026-10-03) | pola |
|---|---|---|---|---|
| `mammography` | Program profilaktyki raka piersi | GSL `specjalizacja=1243&wojewodztwo=07` | **61** miejsc (7 stron); współrzędne 1/61; telefon 61/61. Głównie „PRACOWNIA MAMMOGRAFII” (27), „PORADNIA PROFILAKTYKI CHORÓB PIERSI” (6) | provider, place, address, telefony, godziny, udogodnienia |
| `cervical_screening` | Program profilaktyki raka szyjki macicy (HPV HR) | GSL `specjalizacja=1242&wojewodztwo=07` | **543** miejsc (55 stron); na 1. stronie współrzędne 0/10. Poradnie ginekologiczno-położnicze **i gabinety położnych POZ** | jw. |
| `colonoscopy_screening` | Program badań przesiewowych raka jelita grubego | GSL `specjalizacja=1081` („Kolonoskopia”) `&wojewodztwo=07` | **37** miejsc (4 strony); współrzędne 2/37; telefon 37/37. „PRACOWNIA ENDOSKOPII” (20). Dla porównania: ITL `KOLONOSKOPIA` (AOS) = 98 | jw. |
| `lung_ldct` | Program profilaktyki raka płuca | — | **brak** w słowniku GSL na 2026-10-03 | — |
| `health_check_adult` | Moje Zdrowie | GSL `2122` istnieje, ale realizuje własna POZ | nie sprawdzano (poza zakresem) | — |

Uwaga: to, że „Kolonoskopia” (1081) w słowniku *programów profilaktycznych* GSL oznacza właśnie program przesiewowy, wnioskujemy z kontekstu słownika i z tego, że NFZ linkuje tę wyszukiwarkę jako „gdzie wykonasz bezpłatną kolonoskopię” (`docs/research/nfz-benefits.md`). Słownik nie ma opisu (`Komentarz: null`).

## 3. API Umowy (UMW) — co wiadomo ze Swaggera

Źródło: `https://api.nfz.gov.pl/app-umw-api/swagger/v1.2/swagger.json` (streszczenie: `umw-swagger-v1.2-summary.json`). Dokumentacja: https://api.nfz.gov.pl/app-umw-api (wersja 1.2, ostatnia zmiana w changelogu: 31.03.2022).

- `GET /agreements?year=&branch=` (oba **wymagane**) + `serviceType`, `productCode`, `providerCode`, `providerName`, `place`, `nip`, `regon`, `updatedAt`. Pola: `code`, `service-type`, `service-name`, `amount`, `provider-code`, `provider-nip`, `provider-regon`, `provider-name`, `provider-place`, `year`, `branch`, `updated-at`.
- `GET /providers/{year}?branch=&serviceType=&productCode=` → `provider-attributes`: `branch`, `code`, `name`, `nip`, `regon`, `registry-number`, `post-code`, `street`, `place`, `phone`, `commune`, `amount`. **Bez współrzędnych, bez TERYT, bez miejsc udzielania świadczeń** — adres to adres podmiotu (np. siedziba sieci przychodni).
- `GET /plans/{id}` → produkty kontraktowe umowy (`product-code`, `product-name`, `unit-count`, `price`, `date-from`, `date-to`).
- Słowniki: `GET /service-types?year=`, `GET /contract-products?year=&name=` — **tu byłyby kody programów; w czasie badania 503**.
- Paginacja: `page`, `limit` (domyślnie 10, max 25), `links.next` (JSON API, jak ITL).
- Status: `/version` → 200 (`{"major":1,"minor":2,…}`), każdy endpoint z danymi (`available-years`, `service-types`, `contract-products`, `providers`) → `503 {"error-result":"Maintenance","error-code":4200003}` przez ≥ 13 min (22:51–23:04 CEST) (`umw-maintenance-503.json`). Nie wiemy, czy to nocne okno serwisowe, czy dłuższa przerwa.

**Wniosek:** UMW przydałoby się do potwierdzenia „ma umowę na program w 2026” i do NIP/REGON, ale **nie zastąpi GSL** jako źródła listy miejsc dla pacjenta (adres podmiotu ≠ adres pracowni, brak telefonu do rejestracji danego miejsca). Kody `serviceType`/`productCode` dla programów: **NIEUSTALONE** — do sprawdzenia, gdy API wróci (`/service-types?year=2026&name=profilakt`, `/contract-products?year=2026&name=mammo`).

## 4. Współrzędne — jak je uzupełnić

1. **GUGiK UUG** (oficjalna usługa państwowa, bez klucza):
   `GET https://services.gugik.gov.pl/uug/?request=GetAddress&address=<Miasto>, <Ulica> <nr>&srid=4326` → `results["1"].x` = długość, `.y` = szerokość, `accuracy` (próbka: `gugik-uug-geocode.json`).
   Test na 6 adresach z GSL: 4/6 trafień od razu. 2 adresy warszawskie nie przeszły, bo GSL podaje dzielnicę („Ursynów”, „Mokotów”) zamiast miasta. Po podmianie na „Warszawa” → 6/6 (accuracy 0.77–1.0). Reguła: kod pocztowy `00-`…`04-` lub znana dzielnica → miasto „Warszawa”. Prawdopodobnie podobnie w innych miastach z dzielnicami (Kraków, Łódź) — niezweryfikowane.
2. Join z ITL po znormalizowanym adresie (ulica + numer + miejscowość) — możliwy dla części miejsc (np. pracownie endoskopii są też w ITL `KOLONOSKOPIA`), ale bez wspólnego klucza. Traktować jako uzupełnienie, nie podstawę.
3. Fallback: brak współrzędnych → pokazujemy na liście bez odległości, sortujemy na końcu.

## 5. Propozycja implementacji (~1–2 h)

### Decyzja do podjęcia przez zespół (robots.txt)
GSL deklaruje `Disallow: /`. Proponujemy:
- **Wariant A (rekomendowany na hackathon):** jednorazowy, ręcznie uruchomiony snapshot **tylko woj. 07** dla 3 programów (7 + 4 + 55 = 66 stron, ≈ 4 min przy 3 s/zapytanie), commitowany jako plik danych z datą i atrybucją „Źródło: NFZ, Gdzie się leczyć, stan na 2026-10-03”. Bez pobierania w runtime.
- **Wariant B (zero ryzyka):** bez listy — tylko deep-link do wyszukiwarki GSL + nazwa programu do wybrania (już opisane w `nfz-benefits.md`).
- **Docelowo:** zapytać NFZ o udostępnienie danych / wrócić do UMW, gdy działa.

### Dane (wariant A)
`apps/api/data/programs/<province>/<examId>.jsonl` — linia 1: nagłówek `{ examId, programCode, province, source: 'nfz_gsl', fetchedAt, count }`, potem rekordy. Ten sam styl co `data/snapshot/*.jsonl` (`src/nfz/snapshot.ts`).
Skrypt `apps/api/scripts/program-snapshot.ts` (`pnpm --filter api program-snapshot`): fetch z cookie jar, kolejka ≥ 3 s, parser HTML (regex lub `node-html-parser`), geokodowanie GUGiK (też ≥ 1 s, cache po adresie), zapis JSONL. Mapowanie `examId → programCode` jako stała w API (albo nowe pole `nfzProgramCode` w `ExamRule` — to zmiana kontraktu, wymaga PR wg `03-contracts.md`):
`mammography → '1243'`, `cervical_screening → '1242'`, `colonoscopy_screening → '1081'`.

### Endpoint
`GET /v1/program-providers?examId=&province=&lat=&lng=&radiusKm=&limit=20` (walidacja jak `LocationQuerySchema`; poszerzanie promienia jak w `/facilities`).

```ts
export interface ProgramProvider {
  id: string;                 // hash(provider|place|address) — GSL nie ma ID
  programName: string;        // 'Profilaktyka raka piersi'
  providerName: string;
  placeName: string;
  address: string;            // jak w GSL
  locality: string | null;    // po normalizacji (dzielnica → miasto)
  phone: string | null;       // phoneRegistration ?? phoneInfo
  website: string | null;
  lat: number | null;         // GSL albo GUGiK
  lng: number | null;
  coordsSource: 'nfz' | 'gugik' | null;
  distanceKm: number | null;  // null gdy brak lat/lng
}
export interface ProgramProvidersResponse {
  examId: string;
  province: ProvinceCode;
  items: ProgramProvider[];   // sort: distanceKm rosnąco, null na końcu
  totalInProvince: number;
  asOf: ISODate;              // fetchedAt snapshotu
  source: 'nfz_gsl_snapshot';
  searchUrl: string;          // https://gsl.nfz.gov.pl/GSL/GSL/ProgramyProfilaktyczne
}
```
Błędy: `400 unknown_exam` dla examId bez programu (np. `lung_ldct`). Ewentualnie `200` z `items: []` i `unavailableReason: 'program_not_listed_yet'` — do ustalenia.
Ładowanie: odczyt JSONL przy starcie do pamięci (66 + kilka rekordów na województwo — bez LRU i bez fetchu na żywo).

### Mobile
Na karcie badania `booking: 'program'` sekcja **„Realizatorzy programu w okolicy”**: nazwa pracowni, podmiot, adres, odległość (jeśli znana), przycisk „Zadzwoń” (telefon do rejestracji). Pod listą: „Stan na: 2026-10-03 · Źródło: NFZ »Gdzie się leczyć«. Lista placówek z umową — nie pokazuje wolnych terminów” + link „Pełna wyszukiwarka NFZ”. **Bez** wskaźnika czasu oczekiwania. `notifyDate` dla programów zostaje na `leadTimeSource: 'default'`.

## 6. Zastrzeżenia jakości danych

- **Umowa ≠ przyjmuje pacjentów.** GSL/UMW pokazują, kto ma kontrakt, a nie wolne miejsca.
- **Brak czasów oczekiwania dla programów** we wszystkich sprawdzonych źródłach. `leadTime` dla programów nadal z wartości domyślnej.
- **Współrzędne** z GSL w ≈ 2–5% rekordów. Reszta pochodzi z geokodowania (możliwe pomyłki, zwłaszcza adresy z „/” i dzielnice).
- **Adresy**: w Warszawie dzielnica zamiast miasta; numery typu `14/18`; kod pocztowy bywa „firmowy” (np. 00-911), a nie z PRG.
- **Format HTML** może się zmienić bez ostrzeżenia (wersja zasobów `?2026.09.1.53`). Parser trzeba testować na zapisanych stronach.
- **Cytologia/HPV**: 543 miejsc w samym woj. 07, w tym gabinety położnych POZ. Lista jest duża, więc sensowne jest pokazywanie np. 10 najbliższych.
- **Mammobusy** nie są w GSL jako miejsca stałe. Harmonogramy są tylko w HTML na stronach 16 oddziałów — poza zakresem.
- **LDCT**: brak danych do czasu uruchomienia wyszukiwarki przez NFZ (zapowiedź: II poł. października 2026).
- **UMW**: nie udało się zweryfikować świeżości ani kodów (503).

## 7. Ryzyka i czego NIE mówić w pitchu

- Nie mówić „pokazujemy dostępność / terminy mammografii”. Mówić: „pokazujemy placówki z umową NFZ na program w pobliżu”.
- Nie mówić „dane na żywo z API NFZ” o programach. To snapshot z wyszukiwarki NFZ z datą.
- Nie mówić o LDCT jako działającym — dane o realizatorach jeszcze nie istnieją.
- Nie twierdzić, że API Umowy jest zintegrowane (nie działało w czasie badania; nie ma adresów miejsc ani współrzędnych).
- Ryzyko prawne/wizerunkowe: `robots.txt` GSL zabrania robotów → tylko jednorazowy mały snapshot albo deep-link; nie pokazywać na demo „scrapera”.

## Zapytania wykonane (skrót)

- UMW: `/` (HTML dok.), `/swagger-docs`, `/js/swagger.min.js`, `/swagger/v1.2/swagger.json` (200), `/version` (200), `/available-years`, `/service-types?year=2026` (×5, w tym api-version 1.1), `/contract-products?year=2025&name=mammo`, `/providers?year=2026&branch=07` — wszystkie dane: 503.
- GSL: strona wyszukiwarki, `Dictionary/ZakresyAll?kod_typ=19`, `ProgramyProfilaktyczneSearch` dla 1243/1081/1242 (woj. 07), strony 2–7 (1243) i 2–4 (1081), test `PageSize=100`, `robots.txt`.
- GUGiK UUG: 7 zapytań testowych. dane.gov.pl: 4 zapytania. nfz.gov.pl i nfz-warszawa.pl: strony mammobusów.
