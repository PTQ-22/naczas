# Ekrany kluczowe — low-fi (WS5-1)

> Makiety dla WS4. Tokeny: `docs/design/tokens.md`. Routing i zasady UX: `docs/01-user-journey.md`. Kontrakty danych: `docs/03-contracts.md`.
> Teksty w cudzysłowach to **propozycje** copy — finalnie trafiają do `apps/mobile/src/i18n/pl/<feature>.ts`, nie do komponentów.
> Szkice ASCII pokazują telefon ~360 pt szerokości. Na web treść jest wyśrodkowaną kolumną `layout.maxContentWidth` (640).

Wspólne dla wszystkich ekranów:
- **Jeden główny CTA na ekran** = jedyny wypełniony przycisk `primary`. Reszta akcji: `secondary` / `ghost`.
- Główny CTA na ekranach z formularzem / szczegółami jest **przyklejony do dołu** (nad safe area), żeby był osiągalny kciukiem i nie znikał przy powiększonej czcionce.
- Tryb senior: te same komponenty, tokeny `typography.senior` + `layout.senior` + nadpisania kontrastu. Dodatkowo ukrywamy elementy oznaczone niżej jako *[senior: ukryj]*.
- Tylko jasny motyw (ciemny usunięty); tryb senior = tokeny, bez osobnych wariantów layoutu.
- Każdy element klikalny: `accessibilityRole` + `accessibilityLabel` (przykłady w sekcjach „A11y”).

---

## 1. Ankieta — pojedynczy krok (`onboarding/[step]`)

Przykład: krok 5 „Historia rodzinna” (multi-select). Ten sam szablon dla wszystkich 7 kroków.

```
┌──────────────────────────────────┐
│ ←  Krok 5 z 7                     │  header: back (ghost, 44×44) + licznik (caption)
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░        │  ProgressBar (primary na surfaceAlt)
│                                  │
│  Pytamy o: Mama (Halina)         │  caption, textMuted — kontekst profilu
│                                  │
│  Czy ktoś z bliskiej rodziny     │  title — jedno pytanie
│  chorował na…                    │
│  Rodzice, rodzeństwo, dzieci.    │  body, textMuted — doprecyzowanie
│                                  │
│ ┌──────────────────────────────┐ │
│ │ ☐  Rak piersi                │ │  OptionTile (min 56 / senior 72)
│ └──────────────────────────────┘ │
│ ┌──────────────────────────────┐ │
│ │ ☑  Rak jelita grubego        │ │  zaznaczony: primarySoft + obrys primary 2px + ikona ✓
│ └──────────────────────────────┘ │
│ ┌──────────────────────────────┐ │
│ │ ☐  Rak prostaty              │ │
│ └──────────────────────────────┘ │
│ ┌──────────────────────────────┐ │
│ │ ☐  Rak jajnika               │ │
│ └──────────────────────────────┘ │
│ ┌──────────────────────────────┐ │
│ │ ☐  Zawał lub udar przed 60.  │ │
│ │    rokiem życia              │ │  tekst się zawija — brak stałej wysokości
│ └──────────────────────────────┘ │
│                                  │
│      Nie wiem / pomiń            │  ghost
├──────────────────────────────────┤
│ [          Dalej           ]     │  sticky primary
└──────────────────────────────────┘
```

**Hierarchia:** pytanie (`title`) → opcje (`bodyLarge`) → CTA. Licznik kroków i kontekst profilu są drugorzędne (`caption`).

**CTA:**
- Główny: „Dalej” (`primary`, sticky). W multi-select aktywny zawsze (brak zaznaczeń = „żadne z powyższych”). W single-select (np. płeć) nieaktywny, dopóki nic nie wybrano.
- Drugorzędny: „Nie wiem / pomiń” (`ghost`) — zawsze obecny (wymóg z `01`). Zapisuje brak odpowiedzi i przechodzi dalej.
- Bez auto-przejścia po tapnięciu opcji: czytnik ekranu i osoby starsze gubią się przy samoczynnej zmianie ekranu.

**Warianty kroków:**
- Krok 2 (rok urodzenia): duże pole liczbowe + walidacja w `danger` pod polem; płeć jako 2 `OptionTile` w rzędzie (zawijają się do kolumny przy dużej czcionce).
- Krok 3 (lokalizacja): `OptionTile` „Użyj mojej lokalizacji” + pole „Kod pocztowy”; pod spodem `caption` o prywatności („Lokalizacja zostaje w telefonie; do wyszukiwania placówek wysyłamy ją zaokrągloną do ok. 1 km.”).
- Krok 7 (ostatnie badania): jedno badanie = jedna karta z 5 chipami odpowiedzi („rok temu / 2–3 lata / dawniej / nigdy / nie pamiętam”); lista przewijana, CTA „Pokaż plan”.

**Stany:** walidacja (tekst błędu + ikona, `danger`, `accessibilityLiveRegion="polite"`); powrót zachowuje odpowiedzi.

**A11y:** `OptionTile` → `accessibilityRole="checkbox"` (multi) / `"radio"` (single) + `accessibilityState={{ checked }}`; ProgressBar → `accessibilityRole="progressbar"`, label „Krok 5 z 7”.

**Senior:** opcje 72 pt, rzędy zamieniają się w kolumnę; *[senior: ukryj]* nic — ten ekran już jest minimalny.

---

## 2. Plan — oś czasu (`(tabs)/plan`) — „wow moment”

```
┌──────────────────────────────────┐
│ (●Ja) (◉Mama ②) (+)              │  ProfileSwitcher: avatar + imię, badge = liczba act_now
│                                  │
│ Plan badań — Mama                │  title
│ 2 badania wymagają działania     │  bodyLarge — podsumowanie jednym zdaniem
│                                  │
│ ● DZIAŁAJ TERAZ                  │  nagłówek sekcji: kropka accent + heading + ikona
│ │┌────────────────────────────┐ │
│ ││▌ (!) Działaj teraz          │ │  ▌= pasek accent 4px; chip urgency (bg+fg+ikona)
│ ││▌ Kolonoskopia              │ │  heading
│ ││▌ Zrób do: 12.2026          │ │  body
│ ││▌ Czeka się ok. 10 tyg. —   │ │  body, act_now.fg — dlaczego teraz
│ ││▌ zacznij szukać terminu.   │ │
│ ││▌ Rak jelita w rodzinie.    │ │  caption textMuted — 1 linia uzasadnienia [senior: ukryj]
│ ││▌[  Znajdź termin (~10 tyg.) ]│ │  PRIMARY — tylko na pierwszej karcie act_now
│ │└────────────────────────────┘ │
│ │┌────────────────────────────┐ │
│ ││▌ (!) Działaj teraz          │ │
│ ││▌ Mammografia               │ │
│ ││▌ Program NFZ, bez skierowania│ │
│ ││▌[ Gdzie zrobić bez skierowania]│ secondary (obrys)
│ │└────────────────────────────┘ │
│ │                                │
│ ● W TYM ROKU                     │
│ │ ┌──────────────────────────┐   │  karty jak wyżej, CTA secondary
│ │ └──────────────────────────┘   │
│ ● PÓŹNIEJ                        │  karty skrócone: nazwa + „ok. 2028” [CTA brak]
│ ✓ ZROBIONE (3)          ▾        │  zwinięte domyślnie
│                                  │
│ ⓘ Aplikacja przypomina, nie      │  Disclaimer (caption) + link „Więcej”
│   diagnozuje.                    │
├──────────────────────────────────┤
│  Plan    Rodzina    Ustawienia   │  tab bar
└──────────────────────────────────┘
```

**Hierarchia:** (1) kogo dotyczy plan i ile pilnych → (2) sekcja „Działaj teraz” → (3) w karcie: nazwa → *kiedy* → *dlaczego teraz* → CTA. Sekcje w kolejności z `Plan.items` (silnik już sortuje: urgency, potem `notifyDate`).

**Oś czasu:** pionowa linia `border` po lewej, kropki sekcji w kolorze `accent`. Wejście kart: fade + 8 pt przesunięcia, `motion.base` (300 ms), stagger 40 ms; przy „ogranicz ruch” — `motion.reduced`.

**Karta (`ExamCard`):**
| Element | Token | Uwagi |
|---|---|---|
| pasek lewy | `urgency[u].accent`, `borderWidth.accent` | |
| chip | `urgency[u].bg` + `fg`, `radius.full`, `label` | ikona + tekst, nigdy sam kolor |
| nazwa | `heading`, `text` | |
| termin | `body`, `text` | „Zrób do: MM.RRRR”; `booked` → „Umówione: 12.01.2027” |
| powód „dlaczego teraz” | `body`, `urgency[u].fg` | tylko `act_now` i `this_year` z kolejką |
| uzasadnienie | `caption`, `textMuted` | `reasons[0]`; *[senior: ukryj]* |
| CTA | wg `booking` (niżej) | |

**CTA wg `ExamRule.booking`** (z `01` §UX):
- `queue` → „Znajdź termin (czeka się ~N tyg.)” → `exam/[id]/facilities`
- `program` → „Gdzie zrobić bez skierowania” → `exam/[id]` (sekcja programu)
- `walk_in` → „Bez zapisów — oznacz jako zrobione”
- `booked` → „Oznacz jako zrobione”; `done` → brak CTA (tap w kartę otwiera szczegóły)

Tylko **pierwsza** karta `act_now` ma CTA `primary`; pozostałe `secondary`. Tap w całą kartę (poza CTA) → `exam/[examId]`.

**Stany:**
- Pusty plan (np. młoda osoba, wszystko zrobione): `EmptyState` „Wszystko na czas. Następne badanie: …”.
- Brak sieci: plan działa (liczony lokalnie); przy `leadTimeSource: 'default'` dopisek `caption` „Szacunkowy czas oczekiwania”.
- Profil bliskiej osoby z pilnymi: badge z liczbą na avatarze w `urgency.act_now.bg` + `urgency.act_now.fg` (para sprawdzona na AA, spójna z chipem urgency).

**A11y:** karta → `accessibilityRole="button"`, label np. „Kolonoskopia, działaj teraz, zrób do grudnia 2026, czeka się około 10 tygodni”; CTA ma osobny label. Nagłówki sekcji → `accessibilityRole="header"`. ProfileSwitcher → `"tab"` + `selected`.

**Senior:** jedna informacja na linię, ukryte uzasadnienie, CTA na pełną szerokość, sekcja „Później” zwinięta jak „Zrobione”.

---

## 3. Karta badania (`exam/[examId]`)

```
┌──────────────────────────────────┐
│ ←                                 │
│ (!) Działaj teraz                │  chip urgency
│ Kolonoskopia                     │  title
│ Zrób do: 12.2026                 │  bodyLarge
│ Zacznij szukać: teraz            │  bodyLarge, urgency.fg
│                                  │
│ ┌──────────────────────────────┐ │  ramka kolejki: urgency[u].bg (lub primarySoft)
│ │ W promieniu 25 km czeka się  │ │  body
│ │ ok. 10 tyg.                  │ │  heading
│ │ Dane NFZ, stan na 2026-09    │ │  caption textSubtle
│ └──────────────────────────────┘ │
│                                  │
│ Dlaczego                         │  heading (header)
│ • Rak jelita grubego w rodzinie  │  body — wszystkie reasons
│ • Wiek 50–65 lat                 │
│                                  │
│ Jak często                       │
│ Co 10 lat (przy wyniku bez zmian)│
│                                  │
│ Skierowanie                      │
│ Potrzebne — od lekarza rodzinnego│
│ Przygotuj prośbę do lekarza  →   │  ghost → visit-prep
│                                  │
│ Jak się przygotować         ▾    │  akordeon (prepTips), zwinięty
│                                  │
│ Źródło: Program badań przesiewo- │  caption + link (primary)
│ wych raka jelita grubego ↗       │
│ [Wartość orientacyjna]           │  chip later.* — tylko gdy verified: false
│ ⓘ Aplikacja przypomina, nie      │  Disclaimer
│   diagnozuje. …                  │
├──────────────────────────────────┤
│ [     Znajdź termin w okolicy    ]│  sticky primary (wg booking)
│        Umówiłem/am się           │  ghost → exam/[id]/book
└──────────────────────────────────┘
```

**Hierarchia:** status + nazwa → *kiedy* (zrobić / zacząć szukać) → realna kolejka NFZ (to nasz wyróżnik — wizualnie najmocniejszy blok treści) → dlaczego → szczegóły (częstotliwość, skierowanie, przygotowanie) → źródło + disclaimer.

**CTA (sticky, para primary + ghost) wg stanu:**
| Stan | Primary | Ghost |
|---|---|---|
| `queue`, nieumówione | „Znajdź termin w okolicy” → facilities | „Umówiłem/am się” |
| `program` | „Gdzie zrobić bez skierowania” → `programUrl` / facilities | „Zrobione” |
| `walk_in` | „Oznacz jako zrobione” | — |
| `booked` | „Oznacz jako zrobione” | „Zmień datę wizyty” |
| `done` | — (brak sticky) | „Zrobione wcześniej? Zmień datę” |

**Treści medyczne (AGENTS.md §7):** sformułowania „zalecane jest…”, nigdy „masz ryzyko…”. Disclaimer zawsze widoczny (nie w akordeonie). `verified: false` → chip „Wartość orientacyjna” przy „Jak często”.

**Stany:** brak danych kolejki → ramka w `surfaceAlt`: „Nie mamy aktualnych danych o kolejce. Przyjęliśmy szacunkowo N tyg.” (`leadTimeSource: 'default'`). `source: 'nfz_snapshot'` → „stan na …” wystarczy, bez ostrzeżeń.

**A11y:** nagłówki sekcji `"header"`; link źródła `"link"` z labelem „Źródło: …, otwiera przeglądarkę”; akordeon `"button"` + `expanded`.

**Senior:** „Jak się przygotować” i „Źródło” zwinięte; ramka kolejki zostaje (kluczowa).

---

## 4. Placówki NFZ (`exam/[examId]/facilities`)

```
┌──────────────────────────────────┐
│ ←  Kolonoskopia — gdzie na NFZ   │  title (zawija się)
│ W promieniu 25 km · 12 placówek  │  caption textMuted
│                                  │
│ ( Najszybciej | Najbliżej )      │  segmented control (radio), min 44
│ ( Lista | Mapa )                 │  tylko mobile; web ≥ 900 px: lista + mapa obok
│                                  │
│ ⓘ Dane z 2026-09, NFZ chwilowo   │  tylko source: 'nfz_snapshot' — surfaceAlt, caption
│   niedostępny.                   │
│ ┌──────────────────────────────┐ │
│ │ [~6 tyg.]  14.11.2026         │ │  chip wait.* (accent kropka + tekst) + data tabular
│ │ Szpital Wojewódzki im. …      │ │  heading — providerName
│ │ Pracownia Endoskopii          │ │  body textMuted — placeName [senior: ukryj]
│ │ ul. Szpitalna 12, Kielce      │ │  body textMuted
│ │ 3,2 km · ♿ winda · P parking  │ │  caption: odległość + ikony z tekstem
│ │ [ ☎ Zadzwoń ]   Nawiguj ↗    │ │  secondary + ghost (PRIMARY tylko na 1. karcie)
│ └──────────────────────────────┘ │
│ ┌──────────────────────────────┐ │
│ │ [~9 tyg.]  05.12.2026         │ │
│ │ …                            │ │
│ └──────────────────────────────┘ │
│  Pokaż więcej                    │
└──────────────────────────────────┘

Mapa:
┌──────────────────────────────────┐
│   (●6)      (●9)                 │  markery: kółko wait.* + liczba tygodni
│        ◎ ty                      │  pozycja użytkownika (zaokrąglona)
│              (●14)               │
├──────────────────────────────────┤
│ ┌ wybrana placówka (karta jak ┐ │  bottom sheet z tą samą FacilityCard
│ └ wyżej, z „Zadzwoń”)          ┘ │
└──────────────────────────────────┘
```

**Hierarchia:** termin (najważniejsze — po to tu jesteśmy) → nazwa → adres/odległość → dostępność → akcje. Przy sortowaniu „Najbliżej” odległość awansuje na początek wiersza meta, termin zostaje w chipie.

**CTA:** „Zadzwoń” (`Linking.openURL('tel:…')`) — `primary` na pierwszej karcie listy, `secondary` na pozostałych; „Nawiguj” (`ghost`, link do map systemowych). `phone: null` → brak „Zadzwoń”, zostaje „Nawiguj”.

**Chip terminu:** `firstAvailableDate` (DD.MM.RRRR) + „~N tyg.” z `waitDays`; kolor kropki wg `waitBuckets` (tokens.md §2.4); `null` → „Brak danych o terminie” w `later.*`.

**Dostępność placówki:** ikona + krótki tekst („winda”, „podjazd”, „parking”, „toaleta”) — pokazujemy tylko `true`. Ikona nigdy bez tekstu.

**Stany:**
- Ładowanie: 3 skeletony kart (`surfaceAlt`), bez spinnera na całym ekranie.
- Błąd sieci bez cache: `EmptyState` „Nie udało się pobrać placówek” + `primary` „Spróbuj ponownie”.
- Pusto: „Brak placówek w promieniu 25 km” + `primary` „Szukaj w promieniu 50 km”.
- Cache z poprzedniego wyniku offline: lista + info „Ostatnio pobrane: …”.

**A11y:** karta jako grupa (`accessible` na kontenerze z labelem „Szpital …, pierwszy termin 14 listopada, około 6 tygodni, 3,2 km”), przyciski osobno fokusowalne; marker mapy z tym samym labelem; segmented control → `"radiogroup"` / `"radio"`. Mapa nie jest jedyną drogą — lista zawiera wszystko.

**Senior:** domyślnie widok Lista; *[senior: ukryj]* `placeName`; „Zadzwoń” na pełną szerokość, „Nawiguj” pod spodem.

---

## Otwarte decyzje (do człowieka / WS4)

1. Krój: systemowy vs Atkinson Hyperlegible (nowa zależność) — `tokens.md` §4.
2. Progi kolorów kolejki 14 / 60 dni — `tokens.md` §2.4.
3. Nazwa/logo „NaCzas” — sprawdzenie kolizji nazwy to osobny punkt WS5-1, nie objęty tym dokumentem.
