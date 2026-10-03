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
  - **167 dni** — średnie czekanie na kolonoskopię w trybie *pilnym* bez znieczulenia (monitoring Alivia, styczeń 2026) → źródło S5
  - Alternatywa dla drugiej liczby (świadomość): **36%** nie wie, gdzie w okolicy zrobić badanie przesiewowe (Stowarzyszenie Sarcoma, 2022) → źródło S7

**Kryterium:** Relation to Category (20%)

## 3. Rozwiązanie
- Jedno zdanie: **„Mówimy nie tylko jakie badanie i kiedy, ale kiedy zacząć je organizować i gdzie zrobić je najszybciej na NFZ — dla Ciebie i Twoich bliskich.”**
- 3 filary (ikona + 3–4 słowa):
  1. **Plan** — indywidualne badania z uzasadnieniem i źródłem
  2. **Kiedy zacząć** — przypomnienie z wyprzedzeniem = realna kolejka
  3. **Gdzie na NFZ** — placówki posortowane po pierwszym terminie, „Zadzwoń”

**Kryterium:** Idea & Innovation (30%)

## 4. Jak to działa
- 4 screeny w rzędzie (z buildu, nie z makiety), strzałki między nimi:
  1. Ankieta (jeden temat na ekran; czas „< 2 min” tylko jeśli potwierdzony testem WS5-2)
  2. Plan — oś czasu z sekcjami „Działaj teraz / W tym roku / Później”
  3. Karta badania — „W promieniu X km czeka się ok. N tyg.”
  4. Placówki — lista + mapa, „Zadzwoń”
- Podpis pod każdym: 3–5 słów.
- Dopisek: „Działa na iOS, Androidzie i w przeglądarce.”

**Kryterium:** Practical Applicability / Usability (20%)

## 5. Nasz wyróżnik — „kiedy zacząć szukać”
- Wzór, dużą czcionką:
  `kiedy zacząć = termin badania − czas czekania w okolicy (p75 z NFZ) − zapas na skierowanie`
- Jedno zdanie, dlaczego p75: *„w 3 na 4 placówkach w okolicy zdążysz”* (`docs/05-scheduling-algorithm.md` §2).
- Mini-przykład z demo (dane z API NFZ, „stan na” z ekranu): kolonoskopia, czekanie ok. N tyg. → przypomnienie N+2 tyg. przed terminem. **Wartości wpisać z działającego demo**, nie z głowy.
- Tabela porównawcza:

| | Przypomnienia o badaniach (np. Doctor Robert) | IKP | **NaCzas** |
|---|---|---|---|
| Plan badań wg wieku/płci/rodziny | ✓ [ŹRÓDŁO?] | [ŹRÓDŁO?] | ✓ |
| Realne kolejki NFZ w okolicy | ✗ [ŹRÓDŁO?] | ✗ [ŹRÓDŁO?] | ✓ |
| „Kiedy zacząć szukać” (lead time) | ✗ | ✗ | ✓ |
| Profile bliskich (opiekun) | ✗ [ŹRÓDŁO?] | [ŹRÓDŁO?] | ✓ |

> ⚠️ Kolumny konkurencji wypełnić dopiero po sprawdzeniu ich aktualnych funkcji (link do strony produktu / sklepu w przypisie). `docs/00-overview.md` tylko twierdzi, że Doctor Robert nie łączy planu z NFZ — trzeba to potwierdzić przed pokazaniem jury. Kolumna IKP do decyzji: zostawić tylko, jeśli zweryfikujemy.

**Kryterium:** Idea & Innovation (30%)

## 6. Opiekun + przygotowanie do wizyty
- **Rodzina na jednym telefonie:** przełącznik profili (Ja / Mama), badge z liczbą pilnych badań u mamy.
- **Przygotowanie do wizyty:** PDF / ekran dla lekarza POZ — „Proszę o skierowanie na…”, czynniki ryzyka, lista badań.
- **Karta aktywności** (stretch — tylko jeśli działa w demo; inaczej usunąć punkt).
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
- Strzałka telefon → API podpisana: **„tylko nazwa świadczenia + lokalizacja ≈ 1 km. Zero danych zdrowotnych.”**
- Punkty:
  - **Prawdziwe dane NFZ** (api.nfz.gov.pl), cache + snapshot — demo działa nawet, gdy NFZ nie odpowiada
  - **Privacy by design:** bez kont, dane zdrowotne tylko na telefonie
  - **Otwarte reguły:** każde zalecenie w JSON ze źródłem; reguły niezweryfikowane oznaczone w aplikacji jako „wartość orientacyjna”
  - **Testy silnika reguł:** {N_TESTS} testów, pokrycie {COVERAGE}% — wpisać z `pnpm test` w dniu oddania

**Kryterium:** Completeness & Implementation Value (10%)

## 9. Wdrożenie i roadmap
- **Teraz (MVP):** plan, „kiedy zacząć”, placówki NFZ, profile rodzinne, PDF dla lekarza.
- **Dalej:**
  1. Synchronizacja opiekun ↔ rodzic (szyfrowana E2E)
  2. Integracja z IKP (import wykonanych badań)
  3. Harmonogram mammobusów
  4. Eksport do kalendarza
- **Model:** narzędzie publiczne / open source; partnerzy: NFZ, samorządy, organizacje pacjentów; opcjonalnie white-label dla pracodawców jako benefit profilaktyczny.

**Kryterium:** Completeness & Implementation Value (10%)

## 10. Demo + linki
- QR → web demo · QR → Expo Go · link do repo
- **Ujawnienie AI i zasobów zewnętrznych** (wymóg regulaminu):
  - Narzędzia AI w developmencie: {lista, np. Claude Code — uzupełnić faktycznie użyte}
  - Dane: API NFZ „Terminy leczenia” (https://api.nfz.gov.pl/app-itl-api)
  - Biblioteki open source: Expo, React Native, Hono, Zod, zustand, date-fns, react-native-maps, Leaflet + OpenStreetMap (atrybucja OSM)
  - Źródła medyczne: lista z `packages/rules/data/*.json` (pole `source`)
- Disclaimer: *„Aplikacja przypomina i edukuje, nie diagnozuje.”*

---

## Liczby na slajd 2 (źródła)

Wszystkie poniżej otwarte i sprawdzone na stronie źródłowej 2026-10-03. Na slajd 2 wybrać **maks. 2** (propozycja: S2 + S5). Przypis na slajdzie: wydawca + rok, pełny URL w notatkach / na slajdzie 10.

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

Uwagi do użycia:
- S1–S3 mierzą objęcie w różnych oknach czasowych (różne interwały programów) — **nie zestawiać ich jako porównania** „który program gorszy”.
- S5 dotyczy trybu **pilnego**, a nasza aplikacja liczy kolejki w trybie stabilnym (`case=1`). Na slajdzie pisać dokładnie „pilna kolonoskopia”. Do demo („czeka się ok. N tyg.”) używamy wyłącznie wartości z naszego API NFZ, nie S5.
- S7 jest z 2022 r.; jeśli potrzebna świeższa liczba o świadomości, użyć S8.
- S9 przyda się na slajdzie 6 (opiekun), tylko z przypisem „za GUS”.

[ŹRÓDŁO?] — **nie używać**, dopóki ktoś nie potwierdzi na stronie źródłowej:
- kolonoskopia ~4,3 mies. w Barometrze WHC 2025 (wartość tylko na wykresie, etykiety nieczytelne)
- „Moje Zdrowie” > 3 mln uczestników (tylko fragment w wynikach wyszukiwania)
- „na kolonoskopię czeka się 3 miesiące” z hooka w `docs/01-user-journey.md` §Demo — brak źródła; w skrypcie zastąpione sformułowaniem bez liczby

## Checklista przed eksportem PDF
- [ ] Wszystkie `{…}` i `[ŹRÓDŁO?]` usunięte lub zastąpione wartościami ze źródłem
- [ ] Screeny z aktualnego buildu (WS4-7), także senior + dark
- [ ] Nazwa po decyzji z `naming.md` na każdym slajdzie
- [ ] ≤ 10 slajdów, PDF otwiera się bez fontów zewnętrznych
- [ ] Spójność z `script.md` (te same liczby, ta sama kolejność)
