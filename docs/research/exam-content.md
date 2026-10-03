# WS1-3 — Treści do UI dla badań (PL, prosty język)

Stan na: **2026-10-03**. Zgodne z AGENTS.md §7: edukujemy i przypominamy, nie diagnozujemy.
Wartości (wiek, interwał, skierowanie) — z [`exams-verified.md`](exams-verified.md); świadczenia i linki — z [`nfz-benefits.md`](nfz-benefits.md).

Format: blok JSON na każde `examId` z polami `name`, `shortReason`, `description`, `prepTips` (zgodne z `ExamRule` w `docs/03-contracts.md`) oraz `referralNote`.
**Uwaga:** `referralNote` nie ma w obecnym kontrakcie `ExamRule` (jest tylko `referral: boolean`). Do decyzji: dodać pole do kontraktu albo trzymać tekst w UI.

Pod każdym blokiem: tabela źródeł — każda informacja faktograficzna z tekstu → URL. Fakty bez oficjalnego źródła **nie weszły do tekstu**; są wypisane w „Luki”.

## Disclaimery

```json
{
  "onboarding": "Aplikacja przypomina o badaniach profilaktycznych i pomaga je zaplanować, ale nie stawia diagnozy i nie zastępuje lekarza. Jeśli coś Cię niepokoi albo masz objawy, porozmawiaj z lekarzem rodzinnym.",
  "examCard": "To informacja edukacyjna na podstawie programów NFZ i Ministerstwa Zdrowia — o tym, co jest dla Ciebie najlepsze, zdecyduj razem z lekarzem."
}
```

---

## `health_check_adult`

```json
{
  "name": "Bilans zdrowia „Moje Zdrowie”",
  "shortReason": "Bezpłatny przegląd zdrowia, dzięki któremu wiesz, jakie badania są dla Ciebie zalecane.",
  "description": "Najpierw wypełniasz ankietę o swoim zdrowiu i stylu życia. Potem przychodnia zleca Ci badania, m.in. krwi i moczu. Na wizycie podsumowującej ktoś z personelu zmierzy Ci ciśnienie, tętno, wagę i wzrost, omówi wyniki i przygotuje Twój plan dbania o zdrowie.",
  "prepTips": [
    "Wypełnij ankietę w Internetowym Koncie Pacjenta, w aplikacji mojeIKP albo w swojej przychodni.",
    "Ankietę wypełnij za jednym razem — nie da się zapisać jej w połowie.",
    "Na pobranie krwi przyjdź rano, na czczo."
  ],
  "referralNote": "Nie potrzebujesz skierowania — wystarczy ankieta, a Twoja przychodnia skontaktuje się z Tobą w ciągu 30 dni."
}
```

| fakt | URL |
|---|---|
| ankieta → badania → wizyta podsumowująca; pomiar ciśnienia, tętna, wagi, wzrostu; indywidualny plan | https://pacjent.gov.pl/program-moje-zdrowie |
| badania krwi i moczu w pakiecie podstawowym | https://pacjent.gov.pl/program-moje-zdrowie |
| ankieta w IKP / mojeIKP / POZ; trzeba wypełnić w sposób ciągły | https://pacjent.gov.pl/program-moje-zdrowie |
| POZ kontaktuje się w ciągu 30 dni | https://pacjent.gov.pl/program-moje-zdrowie |
| bez skierowania, zapis przez IKP lub POZ | https://www.gov.pl/web/zdrowie/moje-zdrowie-bilans-zdrowia-osoby-doroslej/ |
| krew rano, na czczo | https://www.gov.pl/web/spzoz-mswia-glucholazy/jak-sie-przygotowac-do-badan-laboratoryjnych |

## `blood_basic`

```json
{
  "name": "Badania krwi: morfologia, cukier, cholesterol",
  "shortReason": "Proste badania krwi pokazują, jak działa Twój organizm, zanim cokolwiek zacznie przeszkadzać.",
  "description": "Pielęgniarka pobiera trochę krwi z żyły w ręce. Z jednej próbki laboratorium sprawdza morfologię, poziom cukru (glukozy) i tłuszczów we krwi (lipidogram). Wyniki omawiasz z lekarzem.",
  "prepTips": [
    "Przyjdź rano, na czczo — po 10–12 godzinach bez jedzenia.",
    "Dzień wcześniej unikaj dużego wysiłku fizycznego.",
    "Przed pobraniem odpocznij kilka minut."
  ],
  "referralNote": "Możesz zrobić te badania bezpłatnie w programie „Moje Zdrowie” — przychodnia da Ci zlecenie po wypełnieniu ankiety."
}
```

| fakt | URL |
|---|---|
| morfologia, glukoza, lipidogram w pakiecie „Moje Zdrowie” | https://pacjent.gov.pl/program-moje-zdrowie |
| zlecenie (nie skierowanie) z POZ po ankiecie | https://pacjent.gov.pl/program-moje-zdrowie |
| rano, na czczo 10–12 h; bez wysiłku; kilka minut odpoczynku | https://www.gov.pl/web/spzoz-mswia-glucholazy/jak-sie-przygotowac-do-badan-laboratoryjnych |

## `blood_pressure`

```json
{
  "name": "Pomiar ciśnienia",
  "shortReason": "Za wysokie ciśnienie długo może nie dawać żadnych objawów, a regularny pomiar zajmuje chwilę.",
  "description": "Ciśnienie zmierzysz w przychodni, w punkcie profilaktycznym NFZ albo samodzielnie w domu ciśnieniomierzem z mankietem. Mankiet zakłada się na ramię i aparat sam pokazuje wynik. Jeśli wyniki często są wysokie, porozmawiaj z lekarzem rodzinnym.",
  "prepTips": [
    "Przez 30 minut przed pomiarem nie pij kawy i nie pal.",
    "Odpocznij 5 minut i usiądź z opartymi plecami.",
    "Mankiet załóż na gołe ramię, rękę oprzyj na wysokości serca.",
    "Mierz zawsze na tej samej ręce."
  ],
  "referralNote": "Nie potrzebujesz skierowania — ciśnienie zmierzysz w przychodni, w punkcie NFZ albo w domu."
}
```

| fakt | URL |
|---|---|
| nadciśnienie może nie dawać objawów przez lata | https://pacjent.gov.pl/aktualnosc/nadcisnienie-tetnicze-nie-boli-badaj-sie-regularnie |
| gdzie: POZ, kioski profilaktyczne NFZ, w domu | https://pacjent.gov.pl/aktualnosc/nadcisnienie-tetnicze-nie-boli-badaj-sie-regularnie |
| zasady pomiaru (kawa/papierosy 30 min, 5 min odpoczynku, pozycja, mankiet, ta sama ręka) | https://pacjent.gov.pl/aktualnosc/nadcisnienie-tetnicze-nie-boli-badaj-sie-regularnie |
| aparat automatyczny z mankietem | https://pacjent.gov.pl/aktualnosc/nadcisnienie-tetnicze-nie-boli-badaj-sie-regularnie |
| pomiar ciśnienia na wizycie „Moje Zdrowie” | https://pacjent.gov.pl/program-moje-zdrowie |

## `dental_checkup`

```json
{
  "name": "Przegląd u dentysty",
  "shortReason": "Regularny przegląd pomaga dbać o zęby i dziąsła, zanim coś zacznie boleć.",
  "description": "Dentysta ogląda Twoje zęby i jamę ustną oraz pokazuje, jak dobrze o nie dbać. Na NFZ takie badanie z instruktażem higieny przysługuje raz w roku. NFZ zaleca wizytę u dentysty co pół roku, bez względu na wiek.",
  "prepTips": [
    "Umyj zęby przed wizytą.",
    "Weź listę leków, które bierzesz na stałe."
  ],
  "referralNote": "Do dentysty nie potrzebujesz skierowania — umów się w gabinecie, który ma umowę z NFZ."
}
```

| fakt | URL |
|---|---|
| badanie stomatologiczne z instruktażem higieny raz w roku | https://pacjent.gov.pl/zapobiegaj/zasady-leczenia-u-dentysty |
| zalecane wizyty co pół roku, bez względu na wiek | https://www.nfz.gov.pl/aktualnosci/aktualnosci-centrali/poradnik-pacjenta-stomatolog-na-nfz-co-ci-przysluguje,8573.html |
| bez skierowania | https://pacjent.gov.pl/zapobiegaj/zasady-leczenia-u-dentysty |

⚠️ `prepTips` dla dentysty **nie mają oficjalnego źródła** (zdrowy rozsądek). Do decyzji: zostawić jako `[]` albo zaakceptować bez źródła.

## `cervical_screening`

```json
{
  "name": "Test HPV (profilaktyka szyjki macicy)",
  "shortReason": "Test pozwala wcześnie wykryć wirusa HPV, zanim pojawią się jakiekolwiek zmiany.",
  "description": "Lekarz lub położna pobiera wymaz z szyjki macicy specjalną szczoteczką — wygląda to tak samo jak dawna cytologia. Z jednej próbki laboratorium robi test HPV, a jeśli trzeba, także cytologię. Gdy wynik jest prawidłowy, kolejny test robi się zwykle za 5 lat.",
  "prepTips": [
    "Nie umawiaj się w czasie miesiączki ani 4 dni przed i po niej.",
    "Kilka dni przed badaniem nie stosuj leków dopochwowych.",
    "Przez 1–2 dni przed badaniem nie współżyj.",
    "Przed pobraniem nie rób USG przezpochwowego."
  ],
  "referralNote": "Nie potrzebujesz skierowania — zapiszesz się w Internetowym Koncie Pacjenta, w mojeIKP albo bezpośrednio w poradni ginekologicznej z umową NFZ."
}
```

| fakt | URL |
|---|---|
| jedno pobranie, test HPV + cytologia LBC z tej samej próbki | https://www.gov.pl/web/zdrowie/przelom-w-profilaktyce-raka-szyjki-macicy--test-hpv-hr-i-cytologia-na-podlozu-plynnym |
| „nie różniło się niczym od tradycyjnej cytologii” | https://www.nfz.gov.pl/aktualnosci/aktualnosci-centrali/wczesniej-niedostepny-teraz-zrobisz-go-na-nfz-test-hpv-hr-skuteczniejsza-profilaktyka-raka-szyjki-macicy,8841.html |
| wykrywa HPV, zanim powstaną zmiany w komórkach | https://www.nfz.gov.pl/aktualnosci/aktualnosci-centrali/wczesniej-niedostepny-teraz-zrobisz-go-na-nfz-test-hpv-hr-skuteczniejsza-profilaktyka-raka-szyjki-macicy,8841.html |
| przygotowanie (miesiączka ±4 dni, leki dopochwowe, współżycie 1–2 dni, USG) | https://www.nfz.gov.pl/aktualnosci/aktualnosci-centrali/wczesniej-niedostepny-teraz-zrobisz-go-na-nfz-test-hpv-hr-skuteczniejsza-profilaktyka-raka-szyjki-macicy,8841.html |
| raz na 5 lat; zapis IKP / mojeIKP / przychodnia | https://pacjent.gov.pl/aktualnosc/umow-sie-na-test-hpv-hr-przez-mojeikp |
| bez skierowania; poradnie ginekologiczne z umową NFZ | https://www.gov.pl/web/zdrowie/przelom-w-profilaktyce-raka-szyjki-macicy--test-hpv-hr-i-cytologia-na-podlozu-plynnym |

## `mammography`

```json
{
  "name": "Mammografia",
  "shortReason": "Mammografia pozwala zauważyć bardzo małe zmiany w piersiach, często zanim da się je wyczuć.",
  "description": "To zdjęcie rentgenowskie piersi z bardzo małą dawką promieniowania. Każdą pierś na kilka sekund ściskają dwie płytki aparatu — może to być chwilę nieprzyjemne, ale jest potrzebne do dobrego zdjęcia. Całe badanie trwa kilka minut.",
  "prepTips": [
    "W dniu badania nie używaj dezodorantu, balsamu, pudru ani talku na piersi i pod pachami.",
    "Jeśli miesiączkujesz, najlepiej umów się w pierwszej połowie cyklu (około 10. dnia).",
    "Weź dowód osobisty i wyniki wcześniejszych badań piersi (USG, mammografia).",
    "Ubierz się w luźne, dwuczęściowe ubranie."
  ],
  "referralNote": "Nie potrzebujesz skierowania — wystarczy dowód osobisty; placówkę lub mammobus znajdziesz w wyszukiwarce NFZ."
}
```

| fakt | URL |
|---|---|
| zdjęcie RTG, minimalna dawka promieniowania; 2 zdjęcia każdej piersi; ucisk kilka sekund; przejściowy dyskomfort | https://www.gov.pl/attachment/4de7b43c-d76b-44e5-bb08-ce6275c7fd8a (MZ/CDR, „Przygotowanie do badania mammograficznego”, 01.03.2026) |
| wczesne wykrycie, nawet zmian niewyczuwalnych | https://www.gov.pl/attachment/4de7b43c-d76b-44e5-bb08-ce6275c7fd8a |
| przygotowanie (dezodorant, cykl ~10. dzień, poprzednie wyniki, ubranie) | https://www.gov.pl/attachment/4de7b43c-d76b-44e5-bb08-ce6275c7fd8a |
| trwa kilka minut; tylko dowód osobisty; bez skierowania | https://pacjent.gov.pl/mammografia-jak-skorzystac |
| wyszukiwarka placówek, mammobusy | https://gsl.nfz.gov.pl/GSL/GSL/ProgramyProfilaktyczne, https://www.nfz.gov.pl/dla-pacjenta/programy-profilaktyczne/mammobusy/ |

## `colonoscopy_screening`

```json
{
  "name": "Kolonoskopia",
  "shortReason": "Kolonoskopia pozwala obejrzeć jelito od środka i wcześnie zauważyć zmiany, które można od razu usunąć.",
  "description": "Lekarz ogląda jelito grube od środka cienkim, giętkim przyrządem z kamerą. Badanie trwa od 15 do 40 minut. Można je zrobić w znieczuleniu, wtedy nic nie czujesz. Kilka dni wcześniej trzeba zmienić dietę i oczyścić jelito specjalnym preparatem.",
  "prepTips": [
    "Placówka da Ci dokładną instrukcję przygotowania — postępuj według niej.",
    "Około tydzień przed badaniem zmień dietę: bez pestek, pomidorów i tłustych wędlin.",
    "Jeśli bierzesz leki z żelazem albo na rozrzedzenie krwi, zapytaj lekarza, czy je odstawić.",
    "Dzień przed badaniem wypij preparat oczyszczający jelito zgodnie z instrukcją."
  ],
  "referralNote": "W programie badań przesiewowych nie potrzebujesz skierowania — placówkę znajdziesz w wyszukiwarce NFZ."
}
```

| fakt | URL |
|---|---|
| lekarz ogląda jelito od środka; 15–40 minut; znieczulenie miejscowe lub ogólne | https://pacjent.gov.pl/program-profilaktyczny/kolonoskopia-badanie-ktore-ratuje-zycie |
| „Do kolonoskopii należy się przygotować”; szczegóły w placówce | https://pacjent.gov.pl/program-profilaktyczny/kolonoskopia-badanie-ktore-ratuje-zycie |
| dieta 7 dni przed (pestki, pomidory, tłuste wędliny), żelazo 7 dni, leki przeciwkrzepliwe → konsultacja, preparat przeczyszczający | https://www.gov.pl/web/spzoz-mswia-szczecin/jak-sie-przygotowac-do-kolonoskopii (szpital MSWiA — instrukcja placówki, nie ogólnokrajowa) |
| bez skierowania w programie; wyszukiwarka NFZ | https://www.nfz.gov.pl/dla-pacjenta/programy-profilaktyczne/program-badan-przesiewowych-raka-jelita-grubego/ |

⚠️ Opis przyrządu („cienki, giętki z kamerą”) i „można od razu usunąć” — **bez dosłownego źródła z listy**; do potwierdzenia albo usunięcia przez WS1.

## `lung_ldct`

```json
{
  "name": "Tomografia płuc (niskodawkowa)",
  "shortReason": "U osób, które dużo paliły, to badanie pomaga wcześnie zauważyć zmiany w płucach.",
  "description": "To bezbolesne badanie obrazowe płuc w tomografie. Używa znacznie mniejszej dawki promieniowania niż zwykła tomografia klatki piersiowej. O tym, czy badanie jest dla Ciebie, decyduje lekarz na wizycie kwalifikującej.",
  "prepTips": [],
  "referralNote": "Nie potrzebujesz skierowania — program na NFZ rusza w październiku 2026, a placówki znajdziesz w wyszukiwarce NFZ."
}
```

| fakt | URL |
|---|---|
| bezbolesne badanie obrazowe; dawka znacznie niższa niż przy standardowej TK | https://www.nfz.gov.pl/aktualnosci/aktualnosci-centrali/oglosilismy-konkursy-do-programu-profilaktyki-raka-pluca-czym-jest-badanie-ndtk,9011.html |
| program dla osób z historią palenia ≥ 20 paczkolat | https://www.dziennikustaw.gov.pl/D2026000097601.pdf |
| kwalifikacja na wizycie kwalifikującej | https://www.dziennikustaw.gov.pl/D2026000097601.pdf |
| bez skierowania; zapisy od października 2026 | https://www.nfz.gov.pl/aktualnosci/aktualnosci-centrali/oglosilismy-konkursy-do-programu-profilaktyki-raka-pluca-czym-jest-badanie-ndtk,9011.html |

## `eye_exam`

```json
{
  "name": "Badanie u okulisty",
  "shortReason": "Niektóre choroby oczu, np. jaskra, długo nie dają objawów, a badanie pozwala je wcześnie zauważyć.",
  "description": "Okulista sprawdza, jak widzisz, i ogląda Twoje oczy, także ich dno. Podstawowe badanie trwa kilkanaście minut i jest bezbolesne.",
  "prepTips": [
    "Weź swoje okulary lub soczewki i wyniki poprzednich badań wzroku."
  ],
  "referralNote": "Do okulisty na NFZ potrzebujesz skierowania od lekarza — bez skierowania możesz pójść do optometrysty."
}
```

| fakt | URL |
|---|---|
| okulista bez skierowania — nie (brak na liście); optometrysta bez skierowania | https://pacjent.gov.pl/artykul/kto-i-kiedy-nie-potrzebuje-skierowania |
| podstawowe badanie do kilkunastu minut, bezbolesne; badanie dna oka; jaskra w starszym wieku | https://pacjent.gov.pl/aktualnosc/dbaj-o-oczy — ⚠️ **tylko z opisu w wyszukiwarce**, strona blokuje automatyczne pobranie (WAF „Request Rejected”); pewność niska |

⚠️ `shortReason` (jaskra długo bez objawów) i `prepTips` — **bez potwierdzonego źródła**. Do ręcznej weryfikacji w przeglądarce.

## `skin_check`

```json
{
  "name": "Kontrola znamion (pieprzyków)",
  "shortReason": "Regularne oglądanie pieprzyków pomaga szybko zauważyć te, które się zmieniają.",
  "description": "Dermatolog ogląda znamiona przez dermatoskop — to rodzaj lupy z mocnym światłem. Badanie jest bezbolesne i trwa 10–15 minut. Między wizytami raz w miesiącu obejrzyj swoją skórę w dobrym świetle, z lustrem albo z pomocą bliskiej osoby.",
  "prepTips": [
    "Raz w miesiącu obejrzyj swoje znamiona według zasady ABCDE (kształt, brzegi, kolor, wielkość, zmiany).",
    "Zapisz lub zrób zdjęcia znamion, które się zmieniły, i pokaż je lekarzowi."
  ],
  "referralNote": "Do dermatologa na NFZ potrzebujesz skierowania — poproś o nie lekarza rodzinnego."
}
```

| fakt | URL |
|---|---|
| dermatoskop: powiększenie 10–20×, światło; bezbolesne, 10–15 min | https://www.nfz.gov.pl/aktualnosci/aktualnosci-centrali/poradnik-pacjenta-czerniak-niebezpieczny-nowotwor-skory-jak-sie-przed-nim-chronic,8438.html |
| samobadanie raz w miesiącu, dobre światło, lustro / druga osoba; ABCDE | https://www.nfz.gov.pl/aktualnosci/aktualnosci-centrali/poradnik-pacjenta-czerniak-niebezpieczny-nowotwor-skory-jak-sie-przed-nim-chronic,8438.html |
| niepokojące zmiany → skonsultuj z lekarzem | https://www.nfz.gov.pl/aktualnosci/aktualnosci-centrali/poradnik-pacjenta-czerniak-niebezpieczny-nowotwor-skory-jak-sie-przed-nim-chronic,8438.html |
| dermatolog wymaga skierowania (brak na liście bez skierowania) | https://pacjent.gov.pl/artykul/kto-i-kiedy-nie-potrzebuje-skierowania |

⚠️ „zrób zdjęcia znamion” — bez dosłownego źródła.

## `psa_discussion`

```json
{
  "name": "Rozmowa o badaniu PSA",
  "shortReason": "Badanie PSA ma zalety i ograniczenia, więc warto razem z lekarzem zdecydować, czy jest dla Ciebie.",
  "description": "PSA to badanie z krwi. Sam wynik nie wystarcza, żeby cokolwiek stwierdzić — zawsze trzeba omówić go z lekarzem. Mężczyźni po 50. roku życia dostają to badanie w programie „Moje Zdrowie”.",
  "prepTips": [
    "Zapisz pytania, które chcesz zadać lekarzowi.",
    "Powiedz lekarzowi, czy ktoś w Twojej rodzinie chorował na prostatę."
  ],
  "referralNote": "Porozmawiaj z lekarzem rodzinnym — w programie „Moje Zdrowie” przychodnia zleci PSA po wypełnieniu ankiety."
}
```

| fakt | URL |
|---|---|
| PSA z krwi; wynik sam nie przesądza, trzeba omówić z lekarzem; „Nie diagnozuj się na własną rękę!” | https://pacjent.gov.pl/zapobiegaj/jak-badac-prostate |
| PSA zleca lekarz rodzinny lub urolog | https://pacjent.gov.pl/zapobiegaj/jak-badac-prostate |
| mężczyźni po 50 r.ż. — pakiet podstawowy i PSA; zlecenie z POZ po ankiecie | https://pacjent.gov.pl/program-moje-zdrowie |

⚠️ `prepTips` — bez oficjalnego źródła (zachęta do rozmowy, nie fakt medyczny).

---

## Luki (do decyzji / ręcznej weryfikacji)

- `eye_exam` — strona pacjent.gov.pl „Dbaj o oczy” blokuje pobieranie (WAF); opis oparty o fragment z wyszukiwarki. Sprawdzić ręcznie w przeglądarce.
- `lung_ldct` — czas trwania badania i przygotowanie: brak w źródłach NFZ/MZ → pominięte.
- `blood_basic`, `dental_checkup` — czas trwania / ból: brak w oficjalnych źródłach → pominięte.
- `colonoscopy_screening` — instrukcja przygotowania pochodzi od jednej placówki (szpital MSWiA w Szczecinie), więc w `prepTips` jest odesłanie do instrukcji własnej placówki.
- `prepTips` oznaczone ⚠️ (dentysta, okulista, znamiona — zdjęcia, PSA) — rady ogólne bez źródła; do akceptacji przez właściciela treści albo usunięcia.
- `referralNote` — pole spoza kontraktu `ExamRule`.
