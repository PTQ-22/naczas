# Slajdy — treść (≤ 10)

> Struktura wg `docs/07-pitch-and-submission.md` §Struktura slajdów. Eksport: PDF, maks. 10 slajdów.
> Nazwa robocza: **NaCzas** — propozycje zmiany w `pitch/naming.md`; po decyzji podmienić na wszystkich slajdach.
> Zasada liczb: każda liczba ma przypis ze źródłem (URL w „Źródła” na dole slajdu, `caption`). Liczba bez źródła = `[ŹRÓDŁO?]` i **nie idzie na slajd**, dopóki ktoś jej nie potwierdzi.
> Wizualnie: tokeny z `docs/design/tokens.md` (tło `#FAF7F2`, akcent `#1C6B66`, kolory urgency tylko na screenach/osi czasu). Jedna myśl na slajd, max ~25 słów tekstu poza screenami.

---

## 1. Tytuł
- **Nazwa** + logo
- Claim: *„Wiesz co, kiedy i gdzie — zanim będzie za późno.”*
- Nazwa zespołu · członkowie (imiona) · kategoria hackathonu
- Tło: fragment osi czasu z czerwoną kartą „Kolonoskopia — zacznij szukać teraz”

**Kryterium:** —

## 2. Problem
- Nagłówek: **„Kasia wie, że mama powinna się badać. Nie wie: co, kiedy i gdzie.”**
- Lewa kolumna: Kasia (34) + mama (58, rak jelita w rodzinie) — ikony/ilustracja, bez stockowych zdjęć szpitala.
- Prawa kolumna: 3 bariery, każda jednym słowem + krótko:
  1. **Zapominamy** — kiedy ostatnio i jak często?
  2. **Nie wiemy** — które badania dotyczą *mnie* (wiek, płeć, rodzina)?
  3. **Za późno** — na wiele świadczeń NFZ czeka się tygodniami.
- Pasek z 1–2 liczbami (patrz §Liczby niżej):
  - **17,39%** — tyle uprawnionych osób objął program badań przesiewowych raka jelita grubego (NFZ, stan na 1.10.2026) → źródło S2
  - **ponad 4,5 miesiąca** — w połowie placówek NFZ średni czas oczekiwania na kolonoskopię jest dłuższy (mediana: 137,5 dnia mazowieckie, 158 dni małopolskie) → źródło S10. Przypis na slajdzie: *„API NFZ Terminy Leczenia, stan na 2026-09, średni czas oczekiwania raportowany przez placówki”*
  - Alternatywa dla drugiej liczby (świadomość): **36%** nie wie, gdzie w okolicy zrobić badanie przesiewowe (Stowarzyszenie Sarcoma, 2022) → źródło S7

**Kryterium:** Relation to Category (20%)

## 3. Rozwiązanie
- Jedno zdanie: **„Mówimy nie tylko jakie badanie i kiedy, ale kiedy zacząć je organizować i gdzie zrobić je najszybciej na NFZ — a potem umawiamy wizytę za Ciebie i Twoich bliskich.”**
- 4 filary (ikona + 3–4 słowa):
  1. **Plan** — indywidualne badania z uzasadnieniem i źródłem
  2. **Kiedy zacząć** — przypomnienie z wyprzedzeniem = szacunek z kolejek NFZ w okolicy (p75)
  3. **Gdzie na NFZ** — placówki posortowane po średnim czasie oczekiwania, „Zadzwoń”
  4. **Umówimy za Ciebie** — agent AI dzwoni do rejestracji i umawia termin w Twoich godzinach (demo: dzwoni na nasz numer testowy)

**Kryterium:** Idea & Innovation (30%)

## 4. Jak to działa
- 5 screenów w rzędzie (z buildu, nie z makiety), strzałki między nimi:
  1. Ankieta (jeden temat na ekran; czas „< 2 min” tylko jeśli potwierdzony testem WS5-2)
  2. Plan — oś czasu z sekcjami „Działaj teraz / W tym roku / Później”
  3. Placówki — lista + mapa, „Zadzwoń za mnie”
  4. Agent dzwoni — transkrypcja rozmowy na żywo
  5. Termin w kalendarzu — „Umówiono na …”, wizyta w planie i w kalendarzu telefonu
- Podpis pod każdym: 3–5 słów.
- Dopisek: „Działa na iOS, Androidzie i w przeglądarce.”

**Kryterium:** Practical Applicability / Usability (20%)

## 5. Nasz wyróżnik — „kiedy zacząć szukać”
- Wzór, dużą czcionką:
  `kiedy zacząć = termin badania − czas czekania w okolicy (p75 z NFZ) − zapas na skierowanie`
- Jedno zdanie, dlaczego p75: *„w 3 na 4 placówkach w okolicy zdążysz”* (`docs/05-scheduling-algorithm.md` §2).
- Mini-przykład z demo (dane z API NFZ, „stan na” z ekranu): kolonoskopia, czekanie ok. N tyg. → przypomnienie N+2 tyg. przed terminem. **Wartości wpisać z działającego demo**, nie z głowy.
- Tabela porównawcza:

Na slajd (uproszczona; ✓/✗/? tylko tam, gdzie mamy URL — szczegóły i cytaty w tabeli pełnej niżej):

| | Doctor Robert | IKP / mojeIKP | **NaCzas** |
|---|---|---|---|
| Plan badań wg profilu | ✓ | ✓ jednorazowy bilans („Moje Zdrowie”) | ✓ ciągły plan |
| Przypomnienia o badaniach | ✓ | ✗¹ (leki i wizyty z e-rejestracji) | ✓ |
| Kolejki NFZ | ? | ✓ osobno, na portalu pacjent.gov.pl | ✓ w planie |
| Wskazanie placówek | ✗ (w planach) | ✓ e-rejestracja (wybrane świadczenia) | ✓ |
| Profile rodzinne / opiekun | ? | ✓ dzieci, upoważnienia | ✓ |
| Przygotowanie do wizyty | ✓ do badań | ? | ✓ |
| Umawia wizytę za Ciebie (agent dzwoni) | nie znaleziono³ | nie znaleziono³ | ✓ |
| **„Kiedy zacząć szukać” = plan × kolejka** | ✗² | ✗² | ✓ |

¹ Brak przypomnień o badaniach profilaktycznych w opisach IKP, które otworzyliśmy — formalnie „nie znaleziono”, nie „brak”. Na slajdzie można zostawić ✗ tylko z tym przypisem albo wpisać „?”.
² Żaden z produktów nie łączy osobistego planu badań z danymi o kolejkach — to jest nasz wyróżnik. Wniosek z kombinacji wierszy wyżej, nie z deklaracji producentów.
³ W źródłach [DR], [AS], [GP], [ER], [IKP3] nie znaleźliśmy funkcji, w której aplikacja sama dzwoni i umawia wizytę. IKP ma e-rejestrację (pacjent rezerwuje sam, wybrane świadczenia), Doctor Robert zapowiada rezerwację „w przyszłości” [GP]. Na slajdzie „nie znaleziono”, nie „✗”.

**Uczciwy przekaz na slajd/Q&A:** nie mówimy „nikt nie ma danych NFZ” — IKP ma kolejki i e-rejestrację, Doctor Robert ma plan i przypomnienia. Mówimy: *„Doctor Robert mówi co i kiedy, IKP pozwala znaleźć termin — my łączymy to w jedno i mówimy, kiedy zacząć szukać, żeby zdążyć.”*

Tabela pełna (sprawdzone 2026-10-03; ✓ tylko przy stronie potwierdzającej funkcję, „?” = nie znaleziono potwierdzenia):

| Kryterium | Doctor Robert | IKP / mojeIKP |
|---|---|---|
| 1. Plan badań wg profilu | ✓ „spersonalizowane rekomendacje, dopasowane do Twojego wieku, płci i stylu życia”, plan na 5 lat [AS], [DR], [SR] | ✓ Program Moje Zdrowie: badania wg „wieku, płci i czynniki ryzyka”, co 5 lat (20–49) / co 3 lata (50+) — jednorazowy bilans, nie ciągły plan [MZ] |
| 2. Przypomnienia | ✓ „powiadomień e-mail, SMS i push, by nie zapomnieć o badaniach” [AS], [GP], [DR] | ✓ tylko leki i wizyty z e-rejestracji: przypomnienia „o zażywaniu leków” [IKP3]; „na 7 dni przed wizytą” [ER]. O badaniach profilaktycznych — nie znaleziono |
| 3. Dane o kolejkach NFZ | ? — brak wzmianki na stronie i w sklepach | ✓ na portalu pacjent.gov.pl: „prognozowany czas oczekiwania do lekarza specjalisty” [TL] (nie jako część planu w IKP) |
| 4. Wskazanie placówek | ✗ w planach: „W przyszłości… rezerwację badań w placówkach medycznych” [GP] | ✓ centralna e-rejestracja z wyborem odległości (m.in. mammografia, HPV) [ER]; Moje Zdrowie linkuje listę POZ [MZ] |
| 5. Profile rodzinne / opiekun | ? — tylko persona na stronie („moi rodzice/dziadkowie”), brak opisanej funkcji [DR] | ✓ konto dziecka, upoważnienie drugiego rodzica [TM], [IKP3]. Upoważnienia dorosłych (np. rodzica-seniora) — tylko źródła wtórne, nie potwierdzone |
| 6. Przygotowanie do wizyty | ✓ przygotowanie do badań: „jak się przygotować do badań” [GP]; plan do pobrania jako PDF [DR] | ? — poradniki PDF na pacjent.gov.pl [PW], ale nie jako funkcja IKP/mojeIKP |

Źródła:
- [DR] https://doctorrobert.com/ — producent: Centrum Medyczne Szpital Świętej Rodziny sp. z o.o. (Łódź) z Fundacją Łakomy na Zdrowie; start 4.10.2025
- [AS] https://apps.apple.com/pl/app/doctor-robert/id6744054649 — wersja 2.5
- [GP] https://play.google.com/store/apps/details?id=com.drrobert.app&hl=pl
- [SR] https://swietarodzina.com.pl/profilaktyka/aplikacja-doctorrobert/
- [IKP3] https://pacjent.gov.pl/aktualnosc/poznaj-mojeikp-30 (mojeIKP 3.0, 5.12.2025)
- [MZ] https://pacjent.gov.pl/program-moje-zdrowie
- [ER] https://pacjent.gov.pl/e-rejestracja
- [TL] https://pacjent.gov.pl/terminy-leczenia
- [TM] https://pacjent.gov.pl/aktualnosc/tata-mama-i-mojeikp
- [PW] https://pacjent.gov.pl/przygotuj-sie-do-wizyty-poradniki

**Kryterium:** Idea & Innovation (30%)

## 6. Opiekun + przygotowanie do wizyty
- **Rodzina na jednym telefonie:** przełącznik profili (Ja / Mama), badge z liczbą pilnych badań u mamy.
- **Przygotowanie do wizyty:** PDF / ekran dla lekarza POZ — „Proszę o skierowanie na…”, czynniki ryzyka, lista badań.
- **Karta aktywności** — „mały krok” ruchu pod planem, ze źródłem (jest w buildzie: `apps/mobile/src/features/plan/ActivityCard.tsx`).
- Screen: przełącznik profili + fragment PDF.

**Kryterium:** Relation to Category (20%)

## 7. Design i dostępność
- 3 screeny tego samego ekranu planu: normalny · **tryb senior** (typografia ×1.3, większe pola dotyku) · **dark mode**.
- Punkty (z `docs/design/tokens.md`):
  - kontrast WCAG AA sprawdzony dla wszystkich par kolorów (tryb senior: tekst drugorzędny ≥ 7:1)
  - pilność = ikona + tekst, nigdy sam kolor
  - jeden główny przycisk na ekran, min. 44 pt (senior 56 pt)
  - działa z systemowym powiększeniem czcionki i czytnikiem ekranu

**Kryterium:** Design (20%)

## 8. Technologia
- Diagram (uproszczony z `docs/02-architecture.md`): Telefon (Expo: iOS/Android/web) → cienkie API (Hono) → API NFZ „Terminy leczenia”.
- Druga gałąź: API → agent głosowy (Vapi: gpt-4o, Deepgram, ElevenLabs; Twilio) → **numer testowy zespołu**.
- Strzałka telefon → API podpisana: **„tylko nazwa świadczenia + lokalizacja ≈ 1 km. Zero danych zdrowotnych.”**
- Strzałka API → agent podpisana: **„tylko na Twoje zlecenie: dla kogo (»mamę«), badanie, placówka, godziny. Bez nazwiska i PESEL.”**
- Punkty:
  - **Prawdziwe dane NFZ** (api.nfz.gov.pl), cache + snapshot — demo działa nawet, gdy NFZ nie odpowiada
  - **Privacy by design:** dane zdrowotne domyślnie tylko na telefonie, bez zakładania konta; synchronizacja rodzinna w demo na testowej bazie, docelowo szyfrowana
  - **Otwarte reguły:** każde zalecenie w JSON ze źródłem; reguły niezweryfikowane oznaczone w aplikacji jako „wartość orientacyjna”
  - **1016 testów automatycznych:** silnik reguł 206 (100% pokrycia linii), API 174, aplikacja 582, kontrakty 54 (stan na 2026-10-04)

**Kryterium:** Completeness & Implementation Value (10%)

## 9. Wdrożenie i roadmap
- **Teraz (MVP):** plan, „kiedy zacząć”, placówki NFZ, agent „Umów za mnie”, profile rodzinne, PDF dla lekarza, eksport wizyty do kalendarza.
- **Dalej:**
  1. Synchronizacja opiekun ↔ rodzic (dziś w demo na testowej bazie; docelowo szyfrowana E2E)
  2. Agent z e-rejestracją zamiast telefonu
  3. Integracja z IKP (import wykonanych badań)
  4. Harmonogram mammobusów
- **Model:** narzędzie publiczne / open source; partnerzy: NFZ, samorządy, organizacje pacjentów; opcjonalnie white-label dla pracodawców jako benefit profilaktyczny.

**Kryterium:** Completeness & Implementation Value (10%)

## 10. Demo + linki
- QR → web demo · QR → Expo Go · link do repo
- **Ujawnienie AI i zasobów zewnętrznych** (wymóg regulaminu):
  - Narzędzia AI w developmencie: Claude Code (Claude Opus 5.5), pod nadzorem zespołu
  - AI w aplikacji (agent „Umów za mnie”): Vapi, OpenAI gpt-4o, Deepgram nova-2, ElevenLabs, Twilio; demo dzwoni tylko na numer testowy zespołu
  - Zalecenia medyczne nie pochodzą od AI
  - Dane: API NFZ „Terminy leczenia” (https://api.nfz.gov.pl/app-itl-api), dane NFZ o realizacji programów, GUGiK ULDK
  - Biblioteki open source: Expo, React Native, Hono, Zod, zustand, date-fns, react-native-maps, Leaflet + OpenStreetMap (atrybucja OSM)
  - Źródła medyczne: lista z `packages/rules/data/*.json` (pole `source`)
- Disclaimer: *„Aplikacja przypomina i edukuje, nie diagnozuje.”*

---

## Liczby na slajd 2 (źródła)

Wszystkie poniżej otwarte i sprawdzone na stronie źródłowej 2026-10-03. Na slajd 2 wybrać **maks. 2** (propozycja: S2 + S10). Przypis na slajdzie: wydawca + rok, pełny URL w notatkach / na slajdzie 10.

| ID | Liczba | Co mierzy | Okres | Wydawca | URL |
|---|---|---|---|---|---|
| S1 | 32,95% | objęcie populacji programem mammografii (8 707 246 uprawnionych) | stan na 1.10.2026 | NFZ, „Dane o realizacji programów” (XLSX, wiersz RAZEM) | https://www.nfz.gov.pl/dla-pacjenta/programy-profilaktyczne/dane-o-realizacji-programow/ · plik: https://www.nfz.gov.pl/download/gfx/nfz/pl/defaultstronaopisowa/483/144/1/mammografia_1.10.2026_r..xlsx |
| S2 | 17,39% | objęcie populacji programem raka jelita grubego / kolonoskopia (8 605 682 uprawnionych) | stan na 1.10.2026 | NFZ (j.w.) | plik: https://www.nfz.gov.pl/download/gfx/nfz/pl/defaultstronaopisowa/483/144/1/kolonoskopia_1.10.2026_r..xlsx |
| S3 | 16,04% | objęcie populacji programem raka szyjki macicy / test HPV HR (11 967 417 uprawnionych) | stan na 1.10.2026 | NFZ (j.w.) | plik: https://www.nfz.gov.pl/download/gfx/nfz/pl/defaultstronaopisowa/483/144/1/hpv_hr_1.10.2026_r..xlsx |
| S4 | 33,5% (cel: 60% na koniec 2024) | zgłaszalność na mammografię | 2025 | Alivia Onkofundacja (informacja prasowa) | https://alivia.org.pl/aktualnosci/pink-october-2026-informacja-prasowa/ |
| S5 | 167 dni (310 dni ze znieczuleniem) | średni czas oczekiwania na kolonoskopię w trybie pilnym | publikacja 13.01.2026 | TVN24 za Alivia Onkoskaner (nie są to oficjalne dane NFZ) | https://tvn24.pl/zdrowie/167-dni-na-pilna-kolonoskopie-nowe-raporty-alivii-i-whc-pokazuja-skale-kolejek-do-badan-i-lekarzy-st8843350 |
| S6 | 2,8 mies. (średnio na badanie diagnostyczne); 9,9 mies. (do gastroenterologa) | średnie czasy oczekiwania na świadczenia gwarantowane | wrzesień/październik 2025 | Fundacja Watch Health Care, Barometr WHC 2025 | https://www.korektorzdrowia.pl/wp-content/uploads/barometr-whc-2025.pdf |
| S7 | 36% nie wie, gdzie w okolicy zrobić badanie; 39% nie wie, że badania są bezpłatne; 64% nie bada się regularnie | sondaż Polaków | raport z 22.11.2022 | Stowarzyszenie Sarcoma, „Dlaczego się nie badamy?” | https://cowzdrowiu.pl/aktualnosci/post/dlaczego-sie-nie-badamy-premiera-raportu |
| S8 | 21% robi regularne badania onkologiczne właściwe dla wieku i płci | sondaż (raport enel-med „Badanie, które daje czas”, liczebność próby nie podana) | artykuł z 23.09.2026 | Polityka Zdrowotna za enel-med | https://politykazdrowotna.com/artykul/profilaktyka-raka-w-polsce-n2502892 |
| S9 | 9,47 mln osób w wieku 18–74 (35,9%) ma obowiązki opiekuńcze | GUS, moduł BAEL 2025 (źródło wtórne; liczb w oryginale GUS nie odczytano) | 2025 | alertmedyczny.pl za GUS | https://alertmedyczny.pl/gus-9-5-mln-polakow-opiekuje-sie-bliskimi-kobiety-czesciej-maja-obowiazki-opiekuncze/ |

### S10 — czasy oczekiwania z API NFZ (obliczone przez nas)

Źródło: API NFZ „Terminy Leczenia” (`https://api.nfz.gov.pl/app-itl-api/queues`, `case=1` — kolejka stabilna), pole `statistics.provider-data.average-period` = średni czas oczekiwania raportowany przez placówkę (dni). Surowe dane: `apps/api/test/fixtures/queues/{06,07}/*.json`, pobrane 2026-10-03, `update` = 2026-09 (stomatologia: część placówek 2026-08). Obliczenia: `node pitch/scripts/wait-stats.mjs`.

| Woj. | Świadczenie NFZ | Placówki z danymi / wszystkie | Mediana (dni) | p75 (dni) | Min–max (dni) |
|---|---|---|---|---|---|
| 06 małopolskie | KOLONOSKOPIA | 43 / 44 | **158** | 219,5 | 32–399 |
| 07 mazowieckie | KOLONOSKOPIA | 96 / 98 | **137,5** | 212,8 | 12–417 |
| 06 małopolskie | ŚWIADCZENIA Z ZAKRESU OKULISTYKI | 114 / 121 | 201,5 | 290,5 | 20–731 |
| 07 mazowieckie | ŚWIADCZENIA Z ZAKRESU OKULISTYKI | 230 / 247 | 73 | 138 | 3–827 |
| 06 małopolskie | PORADNIA STOMATOLOGICZNA | 384 / 567 | 22 | 44 | 1–968 |
| 07 mazowieckie | PORADNIA STOMATOLOGICZNA | 485 / 790 | 29 | 51 | 1–460 |

Metoda i zastrzeżenia (do Q&A):
- Uwzględnione tylko `average-period > 0` (0 = placówka nie zaraportowała, `docs/04` §Pułapki).
- Percentyl: interpolacja liniowa (= `PERCENTILE.INC` w arkuszu). Wstępne liczby WS2 (07: 137 / p75 211) wynikają z innej metody — wartość o indeksie `floor((n−1)·p)` bez interpolacji. Różnica ≤ 8,5 dnia, wniosek ten sam.
- To mediana **po placówkach** (każda placówka waży tyle samo), nie po pacjentach. Mówimy więc „w połowie placówek”, nie „połowa pacjentów czeka”.
- `average-period` to średnia z przeszłości raportowana przez placówkę, nie pierwszy wolny termin (`dates` jest `null` we wszystkich rekordach NFZ). Aplikacja liczy „kiedy zacząć” z tego samego pola i tą samą metodą (`docs/05` §3), więc liczby w demo są spójne z S10.
- Okulistyka 06 vs 07 różni się prawie 3× — nie uogólniać na „Polskę”; na slajdzie zawsze z nazwą województwa.

Uwagi do użycia:
- S1–S3 mierzą objęcie w różnych oknach czasowych (różne interwały programów) — **nie zestawiać ich jako porównania** „który program gorszy”.
- S5 dotyczy trybu **pilnego** i nie jest danymi NFZ — zastąpione przez S10 (oficjalne dane, kolejka stabilna). Zostaje w tabeli tylko jako kontekst do Q&A; na slajdzie pisać wtedy dokładnie „pilna kolonoskopia”.
- Do demo („czeka się ok. N tyg.”) wpisujemy wartość z API dla lokalizacji demo. Może się różnić od S10 tylko zakresem: API liczy p75 placówek w promieniu od użytkownika (15→30→60 km→województwo), S10 — medianę dla całego województwa.
- S7 jest z 2022 r.; jeśli potrzebna świeższa liczba o świadomości, użyć S8.
- S9 przyda się na slajdzie 6 (opiekun), tylko z przypisem „za GUS”.

[ŹRÓDŁO?] — **nie używać**, dopóki ktoś nie potwierdzi na stronie źródłowej:
- kolonoskopia ~4,3 mies. w Barometrze WHC 2025 (wartość tylko na wykresie, etykiety nieczytelne)
- „Moje Zdrowie” > 3 mln uczestników (tylko fragment w wynikach wyszukiwania)
- ~~„na kolonoskopię czeka się 3 miesiące” z hooka w `docs/01-user-journey.md` §Demo~~ — zastąpione liczbą z S10

## Checklista przed eksportem PDF
- [ ] Wszystkie `{…}` i `[ŹRÓDŁO?]` usunięte lub zastąpione wartościami ze źródłem
- [ ] Screeny z aktualnego buildu (WS4-7), także senior + dark
- [ ] Nazwa po decyzji z `naming.md` na każdym slajdzie
- [ ] ≤ 10 slajdów, PDF otwiera się bez fontów zewnętrznych
- [ ] Spójność z `script.md` (te same liczby, ta sama kolejność)
