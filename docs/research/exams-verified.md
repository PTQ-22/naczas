# WS1-1 — Weryfikacja badań z tabeli D (docs/04-data-sources.md)

Stan na: **2026-10-03**. Źródła wyłącznie z pacjent.gov.pl, nfz.gov.pl, gov.pl (w tym Dziennik Ustaw).
Cytaty dosłowne, ≤ 1 zdanie. Brak oficjalnego źródła → `NIEZWERYFIKOWANE`.

Pewność:
- **wysoka** — wartość wprost w aktualnym (2025–2026) oficjalnym źródle,
- **średnia** — źródło oficjalne, ale wartość wynika pośrednio (np. z warunku kwalifikacji albo z braku na liście) lub źródło jest starsze,
- **niska / NIEZWERYFIKOWANE** — brak oficjalnego źródła dla tej wartości.

## Tabela

| examId | wartość | URL | cytat ≤1 zdanie | pewność |
|---|---|---|---|---|
| `health_check_adult` | wiek: 20+ (liczone rocznikowo) | https://pacjent.gov.pl/program-moje-zdrowie | „Każda osoba, która rozpoczęła 20 rok życia i jest ubezpieczona w NFZ, może z niego skorzystać” | wysoka |
| `health_check_adult` | interwał: 20–49 lat co 5 lat; 50+ co 3 lata | https://pacjent.gov.pl/program-moje-zdrowie | „co 5 lat (jeśli ma 20–49 lat) co 3 lata (jeśli ma 50 i więcej lat).” | wysoka |
| `health_check_adult` | skierowanie: nie — ankieta w IKP / mojeIKP / POZ, POZ wystawia zlecenie | https://www.gov.pl/web/zdrowie/moje-zdrowie-bilans-zdrowia-osoby-doroslej/ | „Na badania można się zapisywać przez Internetowe Konto Pacjenta (IKP) lub bezpośrednio w placówce Podstawowej Opieki Zdrowotnej (POZ).” | wysoka |
| `blood_basic` | zakres: morfologia, glukoza, lipidogram (+ kreatynina, TSH) w pakiecie podstawowym „Moje Zdrowie” | https://pacjent.gov.pl/program-moje-zdrowie | „Podstawowe badania w ramach programu obejmą morfologię krwi, poziom glukozy, kreatyninę, lipidogram, TSH, a także lipoproteinę A.” | wysoka |
| `blood_basic` | wiek / interwał: jak `health_check_adult` (20+; co 5 / co 3 lata) — w ramach programu; osobnej oficjalnej rekomendacji 18+ / 12–36 mies. nie znaleziono | https://pacjent.gov.pl/program-moje-zdrowie | „co 5 lat (jeśli ma 20–49 lat) co 3 lata (jeśli ma 50 i więcej lat).” | średnia (hipoteza 18+ / 12–36 mies.: NIEZWERYFIKOWANE) |
| `blood_basic` | skierowanie: w programie zlecenie z POZ po ankiecie (nie e-skierowanie) | https://pacjent.gov.pl/program-moje-zdrowie | „Przychodnia POZ wystawi zlecenie (nie skierowanie) na badania na podstawie wypełnionej przez Ciebie ankiety” | wysoka |
| `blood_pressure` | pomiar w ramach wizyty podsumowującej „Moje Zdrowie” | https://pacjent.gov.pl/program-moje-zdrowie | „W jej trakcie pracownik medyczny przeanalizuje Twoje wyniki, zmierzy ciśnienie, tętno, wagę i wzrost” | wysoka |
| `blood_pressure` | wiek 18+ / interwał 12 mies. | — | — | NIEZWERYFIKOWANE |
| `blood_pressure` | skierowanie | — | — | NIEZWERYFIKOWANE |
| `dental_checkup` | interwał: badanie stomatologiczne z instruktażem higieny raz w roku (NFZ, dorośli) | https://pacjent.gov.pl/zapobiegaj/zasady-leczenia-u-dentysty | „badania lekarskiego stomatologicznego z instruktażem higieny jamy ustnej – raz w roku” | wysoka |
| `dental_checkup` | zalecenie wizyt: co pół roku, bez względu na wiek (zalecenie NFZ, nie limit) | https://www.nfz.gov.pl/aktualnosci/aktualnosci-centrali/poradnik-pacjenta-stomatolog-na-nfz-co-ci-przysluguje,8573.html | „Bez względu na wiek pacjenta powinny odbywać się raz na pół roku.” | wysoka |
| `dental_checkup` | wiek: wszyscy ubezpieczeni | https://www.nfz.gov.pl/aktualnosci/aktualnosci-centrali/poradnik-pacjenta-stomatolog-na-nfz-co-ci-przysluguje,8573.html | „Bez względu na wiek pacjenta powinny odbywać się raz na pół roku.” | średnia |
| `dental_checkup` | skierowanie: nie | https://pacjent.gov.pl/zapobiegaj/zasady-leczenia-u-dentysty | „Do stomatologa nie jest wymagane skierowanie.” | wysoka |
| `cervical_screening` | wiek: K 25–64 | https://pacjent.gov.pl/aktualnosc/umow-sie-na-test-hpv-hr-przez-mojeikp | „Program profilaktyczny raka szyjki macicy obejmuje kobiety w wieku 25–64 lat.” | wysoka |
| `cervical_screening` | interwał: test HPV HR raz na 5 lat (od lipca 2025 HPV HR zastępuje cytologię jako badanie podstawowe; przy HPV+ cytologia LBC); lekarz może zalecić 3 lata | https://pacjent.gov.pl/aktualnosc/umow-sie-na-test-hpv-hr-przez-mojeikp | „Badanie wykonujesz raz na 5 lat, chyba że lekarz zaleci inaczej.” | wysoka |
| `cervical_screening` | interwał — wariant 3 lub 5 lat wg zalecenia lekarza | https://www.gov.pl/web/zdrowie/przelom-w-profilaktyce-raka-szyjki-macicy--test-hpv-hr-i-cytologia-na-podlozu-plynnym | „lekarz zaleci ponowne badanie profilaktyczne po upływie 3 lub 5 lat” | wysoka |
| `cervical_screening` | skierowanie: nie | https://www.gov.pl/web/zdrowie/przelom-w-profilaktyce-raka-szyjki-macicy--test-hpv-hr-i-cytologia-na-podlozu-plynnym | „Do udziału w programie nie potrzeba skierowania.” | wysoka |
| `mammography` | wiek: K 45–74 | https://www.nfz.gov.pl/aktualnosci/aktualnosci-centrali/mammografia-i-cytologia-wazne-zmiany-w-programach-profilaktycznych-na-nfz,8497.html | „Od 1 listopada 2023 r. profilaktyczną mammografię na NFZ będą mogły zrobić panie w wieku 45 – 74 lata” | wysoka |
| `mammography` | interwał: 24 mies. (brak mammografii w ostatnich 2 latach; zaproszenie po 2 latach) | https://www.nfz.gov.pl/dla-pacjenta/programy-profilaktyczne/ | „dostaniesz zaproszenie na ponowne badanie za 2 lata” | wysoka |
| `mammography` | skierowanie: nie | https://www.nfz.gov.pl/dla-pacjenta/programy-profilaktyczne/ | „Do udziału w programie nie potrzebujesz skierowania.” | wysoka |
| `colonoscopy_screening` | wiek: 50–65; 40–49 przy raku jelita grubego u najbliższych krewnych | https://www.nfz.gov.pl/dla-pacjenta/programy-profilaktyczne/program-badan-przesiewowych-raka-jelita-grubego/ | „od 50 do 65 lat, lub od 40 do 49 lat, jeśli u najbliższych krewnych pacjenta, rozpoznano nowotwór jelita grubego” | wysoka |
| `colonoscopy_screening` | interwał: 120 mies. (warunek: brak kolonoskopii w ostatnich 10 latach) | https://www.nfz.gov.pl/dla-pacjenta/programy-profilaktyczne/program-badan-przesiewowych-raka-jelita-grubego/ | „nie miały wykonywanej kolonoskopii w ciągu ostatnich 10 lat” | średnia (interwał wynika z warunku kwalifikacji) |
| `colonoscopy_screening` | skierowanie: nie (w programie przesiewowym) | https://www.nfz.gov.pl/dla-pacjenta/programy-profilaktyczne/program-badan-przesiewowych-raka-jelita-grubego/ | „Do udziału w programie nie jest potrzebne skierowanie” | wysoka |
| `lung_ldct` | wiek: 55–74 przy ≥ 20 paczkolatach i abstynencji ≤ 15 lat; 50–54 tylko z dodatkowym czynnikiem ryzyka (ekspozycja zawodowa, radon, rak płuca u krewnych I st., POChP, wybrane nowotwory w wywiadzie) | https://www.dziennikustaw.gov.pl/D2026000097601.pdf | „co 12 miesięcy u osób w wieku 55–74 lat z konsumpcją tytoniu większą lub równą 20 paczkolat, z okresem abstynencji tytoniowej niedłuższym niż 15 lat” | wysoka |
| `lung_ldct` | interwał: 12 mies. (follow-up wg LungRADS v2 2022 — ustala lekarz) | https://www.dziennikustaw.gov.pl/D2026000097601.pdf | „co 12 miesięcy u osób w wieku 50–54 lat z konsumpcją tytoniu większą lub równą 20 paczkolat” | wysoka |
| `lung_ldct` | skierowanie: nie; kwalifikacja na wizycie kwalifikującej; program na NFZ od X 2026 | https://www.nfz.gov.pl/aktualnosci/aktualnosci-centrali/oglosilismy-konkursy-do-programu-profilaktyki-raka-pluca-czym-jest-badanie-ndtk,9011.html | „do badania NDTK w ramach programu profilaktycznego NFZ nie jest potrzebne skierowanie” | wysoka |
| `eye_exam` | wiek 40+ / interwał 24 mies. | — | — (brak programu profilaktycznego jaskry NFZ w źródłach oficjalnych) | NIEZWERYFIKOWANE |
| `eye_exam` | skierowanie: tak (okulisty nie ma na liście specjalistów bez skierowania; bez skierowania jest optometrysta) | https://pacjent.gov.pl/artykul/kto-i-kiedy-nie-potrzebuje-skierowania | „psychiatra, ginekolog i położnik, onkolog, wenerolog, dentysta, lekarz medycyny sportowej” | średnia (wniosek z braku na liście) |
| `skin_check` | wiek 18+ / interwał 12 mies. | — | — (brak programu profilaktycznego NFZ w źródłach oficjalnych) | NIEZWERYFIKOWANE |
| `skin_check` | skierowanie: tak do dermatologa (brak na liście specjalistów bez skierowania) | https://pacjent.gov.pl/artykul/kto-i-kiedy-nie-potrzebuje-skierowania | „psychiatra, ginekolog i położnik, onkolog, wenerolog, dentysta, lekarz medycyny sportowej” | średnia (wniosek z braku na liście) |
| `psa_discussion` | M 50+: PSA w pakiecie „Moje Zdrowie” (co 3 lata dla 50+) | https://pacjent.gov.pl/program-moje-zdrowie | „Mężczyźni po 50 roku życia – otrzymają pakiet podstawowy i PSA.” | wysoka |
| `psa_discussion` | M 45+ przy obciążeniu rodzinnym / interwał 24 mies. | — | — | NIEZWERYFIKOWANE |
| `psa_discussion` | skierowanie: w programie zlecenie z POZ po ankiecie | https://pacjent.gov.pl/program-moje-zdrowie | „Przychodnia POZ wystawi zlecenie (nie skierowanie) na badania na podstawie wypełnionej przez Ciebie ankiety” | wysoka |

## Ankieta v2 — czynniki, które zmieniają plan (2026-10-04)

| examId / skutek | wartość | URL | cytat ≤1 zdanie | pewność |
|---|---|---|---|---|
| `cervical_screening` | co 12 mies. przy HIV lub lekach immunosupresyjnych | https://api.sejm.gov.pl/eli/acts/DU/2025/298/text.pdf | „co 12 miesięcy dla kobiet obciążonych czynnikami ryzyka (zakażonych wirusem HIV, przyjmujących leki immunosupresyjne)” | wysoka |
| `lung_ldct` | 50–54 z czynnikiem ryzyka: POChP, ekspozycja zawodowa, radon, rak płuca u krewnego I st., wybrane przebyte nowotwory; wyłączenie: TK klatki w ciągu 12 mies. | https://www.nfz.gov.pl/dla-pacjenta/programy-profilaktyczne/ | „zdiagnozowany rak płuca u krewnego pierwszego stopnia” | wysoka |
| `tobacco_program` | palący 18+; 40–65 spirometria, jeśli brak POChP i spirometrii w programie w ciągu 36 mies. | https://pacjent.gov.pl/program-profilaktyczny/program-profilaktyki-chorob-odtytoniowych | „jeżeli palisz papierosy lub inne wyroby tytoniowe” | wysoka |
| `cardiovascular_check` | 35–65; bez cukrzycy, przewlekłej choroby nerek, rodzinnej hipercholesterolemii, niektórych chorób układu krążenia; co 5 lat | https://pacjent.gov.pl/program-profilaktyczny/profilaktyka-chorob-ukladu-krazenia-chuk | „nie korzystałeś lub nie korzystałaś z badań w ramach tego programu w ciągu ostatnich 5 lat” | wysoka |
| poradnia genetyczna (pytanie do lekarza, nie badanie) | opieka nad rodzinami wysokiego ryzyka: rak piersi lub jajnika, rak jelita grubego lub trzonu macicy; skierowanie od POZ | https://pacjent.gov.pl/print/pdf/node/5456 | „zgłoś się do lekarza podstawowej opieki zdrowotnej lub do specjalisty” | wysoka |
| `colonoscopy_screening` | 40–49 przy raku jelita grubego u krewnego I stopnia | https://www.nfz.gov.pl/dla-pacjenta/programy-profilaktyczne/program-badan-przesiewowych-raka-jelita-grubego/ | „od 40 do 49 lat, jeśli u najbliższych krewnych pacjenta, rozpoznano nowotwór jelita grubego” | wysoka |

Bez wpływu na żaden program (usunięte z ankiety): nadciśnienie (nie wyklucza z ChUK), rak prostaty w rodzinie (PSA w „Moje Zdrowie” od 50 r.ż. bez względu na rodzinę), zawał/udar u krewnych (ChUK zależy tylko od wieku), wzrost i waga (zbiera je ankieta „Moje Zdrowie”).

## Rozbieżności względem hipotez z tabeli D

- `health_check_adult` — granica przedziałów: **50+** co 3 lata (wg pacjent.gov.pl, liczone rocznikowo); hipoteza „50+” zgodna. gov.pl pisze „powyżej 49 roku życia” — to samo.
- `cervical_screening` — od lipca 2025 badaniem podstawowym jest **test HPV HR co 5 lat** (nie cytologia co 36 mies.). Strona gov.pl „Program profilaktyki raka szyjki macicy” (25–59, co 36 mies., ze skierowaniem w II etapie) jest **nieaktualna** (ost. modyfikacja 2017) — nie używać.
- `lung_ldct` — hipoteza 55–74 zgodna; doszedł wariant **50–54 z czynnikiem ryzyka**; abstynencja ≤ 15 lat. Skierowanie: **nie**. Program dopiero startuje (zapisy od X 2026).
- `colonoscopy_screening` — skierowanie: **nie** w programie przesiewowym. Interwał 10 lat to warunek kwalifikacji, a nie wprost „co 10 lat”.
- `blood_basic`, `blood_pressure` — oficjalnie funkcjonują jako elementy „Moje Zdrowie”, nie jako osobne badania z własnym interwałem. Rekomendacja: albo powiązać je z interwałem bilansu, albo zostawić `verified: false`.
- `eye_exam`, `skin_check` — brak oficjalnego programu profilaktycznego; wiek/interwał niezweryfikowane. Do okulisty i dermatologa potrzebne skierowanie (optometrysta bez skierowania od 17.09.2025).
- `psa_discussion` — oficjalnie: PSA dla mężczyzn 50+ w „Moje Zdrowie”. Wariant 45+ przy obciążeniu i 24 mies. — brak źródła.

## Nie sprawdzano w tym zadaniu

- Nazwy świadczeń w `/benefits` (okulista, dermatolog, proktolog / gastroenterolog) — osobny punkt listy „Do weryfikacji”.
- Link „gdzie zrobić” dla programów.
