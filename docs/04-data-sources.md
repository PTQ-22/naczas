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
- `dates` bywa `null`, statystyki bywają zerowe → takie rekordy pokazujemy na liście („brak danych o terminie”), ale **wykluczamy z agregatu** p50/p75.
- Dane raportowane przez placówki, aktualizacja ~miesięczna → w UI zawsze „stan na: …”.
- **Badań programowych (mammografia, cytologia) nie ma w ITL** (`/benefits?name=mammo` → `[]`). Obsługa przez `booking: 'program'`.
- Kody województw NFZ: `01` dolnośląskie, `02` kujawsko-pomorskie, `03` lubelskie, `04` lubuskie, `05` łódzkie, `06` małopolskie, `07` mazowieckie, `08` opolskie, `09` podkarpackie, `10` podlaskie, `11` pomorskie, `12` śląskie, `13` świętokrzyskie, `14` warmińsko-mazurskie, `15` wielkopolskie, `16` zachodniopomorskie.

## B. API NFZ „Umowy” (opcjonalnie)
- `https://api.nfz.gov.pl/app-umw-api` — kto ma kontrakt na dany zakres. Potencjalnie do listy placówek realizujących programy profilaktyczne. **Stretch**, nie blokuje MVP.

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
| `lung_ldct` | Niskodawkowa TK płuc | 55–74 + palacze ≥ 20 paczkolat | 12 mies. | program | do weryfikacji | — |
| `eye_exam` | Badanie okulistyczne (jaskra) | 40+ | 24 mies. | queue | nie | `ŚWIADCZENIA Z ZAKRESU OKULISTYKI` (zweryfikować nazwę poradni) |
| `skin_check` | Kontrola znamion | 18+ | 12 mies. | queue | do weryfikacji | do znalezienia w `/benefits` |
| `psa_discussion` | Rozmowa o PSA z lekarzem | M 50+ (45+ przy obciążeniu) | 24 mies. | walk_in | — | — (decyzja indywidualna — tylko „porozmawiaj z lekarzem”) |

## Do weryfikacji (WS1 prowadzi tę listę)

- [ ] Aktualne przedziały wieku i interwały dla każdej pozycji z tabeli D
- [ ] Czy kolonoskopia przesiewowa w programie wymaga skierowania
- [ ] Aktualny stan programu LDCT (wiek, kryteria)
- [ ] Program raka szyjki macicy: cytologia vs. HPV, interwały
- [ ] Dokładne nazwy świadczeń w `/benefits` dla okulisty, dermatologa, poradni proktologicznej / gastroenterologicznej
- [ ] Link „gdzie zrobić” dla programów (wyszukiwarka NFZ / pacjent.gov.pl)
