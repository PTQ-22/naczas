# WS1-2 — Nazwy świadczeń NFZ i linki „gdzie zrobić”

Stan na: **2026-10-03**. Dane z API NFZ ITL (`https://api.nfz.gov.pl/app-itl-api`, `api-version=1.3`), zapytania co ≥ 3 s, bez błędów rate limitu.

## 1. Badania `booking: queue` — świadczenia w ITL

Liczba = `meta.count` z `GET /queues?case=1&province=07&benefit=<nazwa>` (woj. mazowieckie, przypadek stabilny).

| examId | nfzBenefits[] | count woj. 07 | uwagi |
|---|---|---|---|
| `dental_checkup` | `["PORADNIA STOMATOLOGICZNA"]` | 790 | `/benefits?name=stomatolog` zwraca 7 nazw; pozostałe to chirurgia, protetyka i warianty „DLA DZIECI” — nie dla przeglądu dorosłych. |
| `colonoscopy_screening` | `["KOLONOSKOPIA"]` | 98 | Jedyny wynik dla `kolonoskop`. To kolejki AOS/diagnostyki, nie program przesiewowy (program → tabela 2). Opcjonalnie `ŚWIADCZENIA Z ZAKRESU GASTROENTEROLOGII` (58) i `PORADNIA PROKTOLOGICZNA` (19) — konsultacje, nie samo badanie. `/benefits?name=endoskop` → `[]`. |
| `eye_exam` | `["ŚWIADCZENIA Z ZAKRESU OKULISTYKI"]` | 247 | To jest poradnia (AOS) — w `place` m.in. „PORADNIA OKULISTYCZNA”, „GABINET OKULISTYCZNY”. Wynik zawiera też gabinety dziecięce → filtrować po `benefits-for-children` / `age-range`. Pozostałe nazwy (`ODDZIAŁ OKULISTYCZNY…`, `OPERACJE JASKRY…`) to leczenie szpitalne — nie używać. Wymaga skierowania (patrz `exams-verified.md`). |
| `skin_check` | `["PORADNIA DERMATOLOGICZNA"]` | 134 | Z `dermatolog`; `PORADNIA DERMATOLOGICZNA DLA DZIECI` i oddziały pominięte. Fragment `skór` zwraca tylko programy lekowe/zabiegi — nie używać. Wymaga skierowania. |

Obserwacje dla WS2:
- Na pierwszej stronie (25 rekordów) każdego z powyższych zapytań wszystkie rekordy miały `dates: null` — agregaty p50/p75 mogą wyjść z małej próby albo pusto.
- Rekord ma pola `benefits-for-children` i `age-range` — przydatne do odfiltrowania placówek dziecięcych.

## 2. Badania `booking: program` — gdzie zrobić / jak się zapisać

| examId | programUrl | opis |
|---|---|---|
| `health_check_adult` | https://pacjent.gov.pl/program-moje-zdrowie | Opis programu i instrukcja: ankieta w IKP (https://pacjent.gov.pl/internetowe-konto-pacjenta), w aplikacji mojeIKP albo w swojej POZ; POZ kontaktuje się w ciągu 30 dni i wystawia zlecenie na badania. Realizuje własna przychodnia POZ — wyszukiwarka placówek niepotrzebna. |
| `cervical_screening` | https://pacjent.gov.pl/aktualnosc/umow-sie-na-test-hpv-hr-przez-mojeikp | Zapis na test HPV HR przez IKP („E-rejestracja” → „Umów badanie profilaktyczne”), mojeIKP albo bezpośrednio w poradni. Placówki: wyszukiwarka NFZ https://gsl.nfz.gov.pl/GSL/GSL/ProgramyProfilaktyczne (realizuje każda poradnia ginekologiczna z umową NFZ i część POZ). |
| `mammography` | https://gsl.nfz.gov.pl/GSL/GSL/ProgramyProfilaktyczne | Wyszukiwarka NFZ „Gdzie się leczyć — programy profilaktyczne” (NFZ linkuje ją jako „Sprawdź, gdzie wykonasz mammografię stacjonarnie”). Mammobusy: https://www.nfz.gov.pl/dla-pacjenta/programy-profilaktyczne/mammobusy/ |
| `lung_ldct` | https://gsl.nfz.gov.pl/GSL/GSL/ProgramyProfilaktyczne | Ta sama wyszukiwarka; NFZ zaznacza, że dla raka płuca działa od II połowy października 2026. Opis programu: https://www.nfz.gov.pl/aktualnosci/aktualnosci-centrali/oglosilismy-konkursy-do-programu-profilaktyki-raka-pluca-czym-jest-badanie-ndtk,9011.html |
| `colonoscopy_screening` (program) | https://gsl.nfz.gov.pl/GSL/GSL/ProgramyProfilaktyczne | Ta sama wyszukiwarka („Sprawdź, gdzie wykonasz bezpłatną kolonoskopię”). Opis programu: https://www.nfz.gov.pl/dla-pacjenta/programy-profilaktyczne/program-badan-przesiewowych-raka-jelita-grubego/ |

Uwagi:
- Linki do wyszukiwarki NFZ wzięte ze strony https://www.nfz.gov.pl/dla-pacjenta/programy-profilaktyczne/ (stan na 2026-10-03). Wszystkie URL-e z tabeli zwracają HTTP 200.
- Lista programów w wyszukiwarce GSL ładuje się dynamicznie — nie da się podlinkować wprost do konkretnego programu (deep link niezweryfikowany). W UI: link do wyszukiwarki + nazwa programu do wybrania.
- Ogólna mapa programów (Narodowa Strategia Onkologiczna): https://onkologia.pacjent.gov.pl/pl/profilaktyka/mapa-programow-profilaktycznych — alternatywa, niezweryfikowana pod kątem kompletności.
