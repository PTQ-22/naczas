# 04 — Źródła danych

## A. API NFZ „Terminy leczenia” (ITL) — zweryfikowane 2026-10-03

- Base URL: `https://api.nfz.gov.pl/app-itl-api`
- Bez klucza. Parametry wspólne: `format=json`, `api-version=1.3`, `page`, `limit` (max 25).
- **Rate limit:** przy kilku szybkich zapytaniach z rzędu API zwraca odpowiedź nie-JSON. → klient z kolejką (≤ 1 req/s), retry z backoffem, cache.

### Endpointy

| Endpoint | Użycie |
|---|---|
| `GET /benefits?name=<fragment>` | Słownik nazw świadczeń. Np. `kolonoskop` → `["KOLONOSKOPIA"]`; `okul` → `["ODDZIAŁ OKULISTYCZNY", "ŚWIADCZENIA Z ZAKRESU OKULISTYKI", …]`; `stomatolog` → `["PORADNIA STOMATOLOGICZNA", …]` |
| `GET /queues?case=1&province=07&benefit=KOLONOSKOPIA` | Kolejki: lista placówek z pierwszym terminem. `case=1` stabilny, `case=2` pilny. Mazowieckie / kolonoskopia: 98 wyników. |
| `GET /localities?name=&province=` | Słownik miejscowości (opcjonalnie) |

### Pola rekordu `queues` (istotne)

```jsonc
{
  "id": "5ce93704-…",
  "attributes": {
    "case": 1,
    "benefit": "KOLONOSKOPIA",
    "provider": "PRZYCHODNIA SPECJALISTYCZNA …",
    "place": "PRACOWNIA ENDOSKOPII (KOLONOSKOPIA)",
    "address": "ARMII KRAJOWEJ 5", "locality": "JÓZEFÓW", "phone": "227898989",
    "latitude": 52.148315, "longitude": 21.2191719,
    "toilet": "N", "ramp": "N", "car-park": "N", "elevator": "N",
    "statistics": { "provider-data": { "awaiting": 0, "removed": 0, "average-period": 0, "update": "2026-09" } },
    "dates": null            // lub { "date": "2026-11-20", "date-situation-as-at": "2026-09-30", ... }
  }
}
```

### Pułapki
- **`dates` = null w 100% rekordów** (WS2-1, 1867 rekordów, api-version 1.2/1.3). Jedyny sygnał czasu: `statistics.provider-data.average-period` (wypełnione w 61–98% rekordów). Mediany: kolonoskopia ~137–158 dni, okulistyka 73–200 dni, stomatolog 22–29 dni.
- Filtr `benefit` działa jak prefiks (`PORADNIA STOMATOLOGICZNA` zwraca też `… DLA DZIECI`) → filtrować po dokładnej nazwie. Okulistyka ambulatoryjna: `ŚWIADCZENIA Z ZAKRESU OKULISTYKI`. 1–17% rekordów bez lat/lng.
- `dates` bywa `null`, statystyki bywają zerowe → takie rekordy pokazujemy na liście („brak danych o terminie”), ale **wykluczamy z agregatu** p50/p75.
- Dane raportowane przez placówki, aktualizacja ~miesięczna → w UI zawsze „stan na: …”.
- **Badań programowych (mammografia, cytologia) nie ma w ITL** (`/benefits?name=mammo` → `[]`). Obsługa przez `booking: 'program'`.
- Kody województw NFZ: `01` dolnośląskie, `02` kujawsko-pomorskie, `03` lubelskie, `04` lubuskie, `05` łódzkie, `06` małopolskie, `07` mazowieckie, `08` opolskie, `09` podkarpackie, `10` podlaskie, `11` pomorskie, `12` śląskie, `13` świętokrzyskie, `14` warmińsko-mazurskie, `15` wielkopolskie, `16` zachodniopomorskie.

## B. API NFZ „Umowy” (opcjonalnie)
- `https://api.nfz.gov.pl/app-umw-api` — kto ma kontrakt na dany zakres. Potencjalnie do listy placówek realizujących programy profilaktyczne. **Stretch**, nie blokuje MVP.

## E. NFZ „Dane o realizacji programów” (objęcie populacji) — zweryfikowane 2026-10-04
- Strona: https://www.nfz.gov.pl/dla-pacjenta/programy-profilaktyczne/dane-o-realizacji-programow/ — co miesiąc 3 pliki xlsx (podział na gminy). Użyty stan na **2026-10-01**: `.../defaultstronaopisowa/483/144/1/mammografia_1.10.2026_r..xlsx`, `hpv_hr_1.10.2026_r..xlsx` (szyjka macicy), `kolonoskopia_1.10.2026_r..xlsx` (prefiks `https://www.nfz.gov.pl/download/gfx/nfz/pl`). Nazwy plików zmieniają się między miesiącami (np. `cytologia_hpv_` do 08.2026) — sprawdzać na stronie.
- Kolumny: OW NFZ, województwo, ID/nazwa powiatu, ID/nazwa gminy (TERYT bez wiodącego zera, gminy miejsko-wiejskie rozbite na miasto `4` i obszar wiejski `5`), kwalifikujący się, wyłączeni ogółem (= badani w programie + leczeni), „Procent objęcia populacji [%]” = wyłączeni / kwalifikujący się. Wiersze `BRAK DANYCH` (tylko w sumie krajowej) i `RAZEM`.
- Konwersja: `pnpm --filter @naczas/api coverage` (`apps/api/scripts/coverage.ts`, parser xlsx bez zależności) → `apps/api/data/screening/coverage.json`. Sumy powiatów/województw liczone z liczebności (nie średnia procentów); skrypt sprawdza formułę NFZ w każdym wierszu i zgodność z `RAZEM`. Przy nowym miesiącu: zmienić `ISSUE`/`AS_OF`/`FILES` w skrypcie.
- Warszawa, Kraków (i inne miasta podzielone w pliku na dzielnice/delegatury): brak wiersza gminy, ULDK zwraca całe miasto → pokazujemy powiat (= miasto).
- GUGiK ULDK `https://uldk.gugik.gov.pl/?request=GetCommuneByXY&xy=lon,lat,4326&result=teryt,commune,county,voivodeship` → `0\n146501_1|Warszawa (miasto)|powiat Warszawa|mazowieckie`; poza Polską `-1 brak wyników`. Bez klucza.

## C. Reguły profilaktyki — źródła do weryfikacji (WS1)

Priorytet źródeł: 1) programy MZ/NFZ (pacjent.gov.pl, nfz.gov.pl), 2) rekomendacje polskich towarzystw naukowych, 3) wytyczne międzynarodowe (USPSTF, ESC) — tylko jako uzupełnienie.

## D. Startowa lista badań (MVP)

> ⚠️ **Wszystkie wartości poniżej to hipotezy robocze do weryfikacji przez WS1.** Programy NFZ zmieniały się w ostatnich latach (m.in. wiek mammografii, zastąpienie „Profilaktyki 40 PLUS” programem „Moje Zdrowie”, testy HPV w programie raka szyjki macicy). W JSON zostają z `"verified": false`, dopóki ktoś nie potwierdzi ze źródłem.

| examId | Badanie | Kogo (hipoteza) | Interwał (hipoteza) | booking | Skierowanie | Świadczenie NFZ |
|---|---|---|---|---|---|---|
| `health_check_adult` | Bilans zdrowia dorosłego („Moje Zdrowie”) | 20+ | 20–49: 5 lat; 50+: 3 lata | program | nie (ankieta w IKP / POZ) | — |
| `blood_basic` | Morfologia, glukoza, lipidogram | 18+ | 12–36 mies. | walk_in | POZ | — |
| `blood_pressure` | Pomiar ciśnienia | 18+ | 12 mies. (nadciśnienie: częściej) | walk_in | nie | — |
| `dental_checkup` | Przegląd stomatologiczny | wszyscy | 12 mies. | queue | nie | `PORADNIA STOMATOLOGICZNA` |
| `cervical_screening` | Cytologia / test HPV | K 25–64 | 36 mies. (do weryfikacji wariant HPV) | program | nie | — |
| `mammography` | Mammografia | K 45–74 | 24 mies. | program | nie | — |
| `colonoscopy_screening` | Kolonoskopia przesiewowa | 50–65; obciążenie rodzinne: od 40 | 120 mies. | queue | do weryfikacji (program vs. AOS) | `KOLONOSKOPIA` |
| `lung_ldct` | Niskodawkowa TK płuc | 55–74 + ≥ 20 paczkolat, abstynencja ≤ 15 lat; 50–54 z dodatkowym czynnikiem ryzyka | 12 mies. | program | nie | — |
| `tobacco_program` | Program profilaktyki chorób odtytoniowych | palący 18+ (spirometria: 40–65 bez POChP) | 36 mies. (przerwa między spirometriami) | program | nie | — |
| `cardiovascular_check` | Profilaktyka chorób układu krążenia (ChUK) | 35–65, bez cukrzycy, PChN, FH, chorób układu krążenia | 60 mies. | program | nie | — |
| `eye_exam` | Badanie okulistyczne (jaskra) | 40+ | 24 mies. | queue | nie | `ŚWIADCZENIA Z ZAKRESU OKULISTYKI` (zweryfikować nazwę poradni) |
| `skin_check` | Kontrola znamion | 18+ | 12 mies. | queue | do weryfikacji | do znalezienia w `/benefits` |
| `psa_discussion` | Rozmowa o PSA z lekarzem | M 50+ (45+ przy obciążeniu) | 24 mies. | walk_in | — | — (decyzja indywidualna — tylko „porozmawiaj z lekarzem”) |

## Do weryfikacji (WS1 prowadzi tę listę)

> Tabela D powyżej to hipotezy historyczne. **Aktualne wartości: `docs/research/exams-verified.md`, nazwy świadczeń i linki: `docs/research/nfz-benefits.md`, teksty: `docs/research/exam-content.md`.**

- [x] Aktualne przedziały wieku i interwały dla każdej pozycji z tabeli D
- [x] Czy kolonoskopia przesiewowa w programie wymaga skierowania (nie)
- [x] Aktualny stan programu LDCT (Dz.U. 2026 poz. 976; start X 2026)
- [x] Program raka szyjki macicy: test HPV HR co 5 lat
- [x] Dokładne nazwy świadczeń w `/benefits`
- [x] Link „gdzie zrobić” dla programów
- [ ] `eye_exam`, `skin_check`: wiek i interwał bez oficjalnego źródła (`verified: false`)
- [x] `lung_ldct` wariant 50–54 z czynnikami ryzyka i abstynencja ≤ 15 lat (ankieta v2)
- [ ] `tobacco_program`: interwał 36 mies. pochodzi z przerwy między spirometriami (40–65); dla porady antytytoniowej u osób < 40 lat źródło nie podaje interwału
- [ ] `cardiovascular_check`: warunek „brak badań w »Moje Zdrowie« w ostatnich 12 mies.” jest tylko w opisie, silnik go nie sprawdza; „niektóre choroby układu krążenia” — o udziale decyduje lekarz
- [ ] `psa_discussion` wariant 45+ przy obciążeniu rodzinnym — brak źródła
- [ ] `blood_basic`, `blood_pressure` — tylko w ramach „Moje Zdrowie”, nie są osobnymi regułami
