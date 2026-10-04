> **Uwaga:** aplikacja ma wyłącznie jasny motyw w kolorystyce „sky” — warianty „Dark” i palety B/C poniżej są historyczne (usunięte z kodu).

# Design tokens — NaCzas (WS5-1)

> Źródło wartości dla `apps/mobile/src/theme/tokens.ts` (właściciel: WS4). Ten dokument jest projektem — implementację w TS robi WS4; blok kodu w §7 jest gotowy do skopiowania.
> Wszystkie pary kolorów z §2–§3 zostały policzone wzorem WCAG 2.x (relative luminance). Wyniki w §3.

## 0. Kierunek (moodboard w 3 zdaniach)

- **Ciepło i spokój, nie szpital.** Tło to ciepła złamana biel / ciepły grafit, kolor marki to głęboki morski turkus (zaufanie, zdrowie bez „chirurgicznego” błękitu).
- **Pilność bez straszenia.** Czerwień jest ceglasta, nie alarmowa; żółty jest bursztynowy. Kolor nigdy nie jest jedynym nośnikiem informacji — zawsze ikona + tekst etykiety (WCAG 1.4.1).
- **Czytelność dla seniora.** Duże kroje, wysoki kontrast, duże pola dotyku; tryb senior to te same komponenty z inną skalą tokenów.

## 1. Semantyka urgency

Klucze tokenów = typ `Urgency` z `docs/03-contracts.md`, żeby w kodzie działało `colors.urgency[item.urgency]` bez mapowania. Nazwy z briefu WS4 podane w nawiasie.

| `Urgency` (WS4) | Sekcja planu | Znaczenie | Ikona (sugestia, Ionicons) | Etykieta (propozycja i18n) |
|---|---|---|---|---|
| `act_now` (`urgent`) | Działaj teraz | `notifyDate ≤ today` — trzeba zacząć organizować | `alert-circle` | „Działaj teraz” |
| `this_year` (`soon`) | W tym roku | do zorganizowania w ciągu roku | `calendar-outline` | „W tym roku” |
| `later` (`later`) | Później | nic do zrobienia teraz | `time-outline` | „Później” |
| `booked` (`booked`) | (w sekcji wg daty) | umówione, czeka na wizytę | `calendar-number-outline` | „Umówione: 12.01” |
| `done` (`done`) | Zrobione | wykonane, policzony kolejny termin | `checkmark-circle` | „Zrobione” |

Każdy kolor urgency ma 3 role:
- `fg` — tekst i ikona (chip, etykieta). Wymóg **≥ 4.5:1** na `bg` tej samej urgency, na `surface` i na tle ekranu.
- `bg` — miękkie tło chipa / ramki informacyjnej. Zwykły `text` też musi mieć na nim ≥ 4.5:1.
- `accent` — pasek po lewej karty, kropka na osi czasu, marker na mapie. Element nietekstowy → **≥ 3:1** (WCAG 1.4.11) na `surface` i tle ekranu.

Zasada: **nie robimy przycisków wypełnionych kolorem urgency.** Jedyny wypełniony przycisk to `primary`. Urgency informuje, nie krzyczy.

## 2. Kolory

### 2.1 Light

| Token | Hex | Użycie |
|---|---|---|
| `bg` | `#FAF7F2` | tło ekranu |
| `surface` | `#FFFFFF` | karty, arkusze, pola |
| `surfaceAlt` | `#F2EDE5` | sekcje wtórne, skeleton, nieaktywne kafle |
| `border` | `#E3DCD1` | **tylko dekoracyjne** separatory (nie niosą informacji) |
| `borderStrong` | `#857B6F` | obrys pól formularza, niezaznaczony `OptionTile`, checkbox |
| `text` | `#1E2A2D` | tekst podstawowy |
| `textMuted` | `#4E5A5E` | tekst drugorzędny (uzasadnienie, adres) |
| `textSubtle` | `#5F686B` | metadane („stan na 2026-09”), placeholder |
| `primary` | `#1C6B66` | główny CTA, linki, zaznaczenie |
| `primaryPressed` | `#155450` | stan wciśnięty |
| `onPrimary` | `#FFFFFF` | tekst na `primary` |
| `primarySoft` | `#DCEDEA` | tło zaznaczonego `OptionTile`, ramka info o kolejce |
| `focus` | `#1C6B66` | pierścień fokusu (web/klawiatura), 3 px |
| `danger` | `#B3261E` | błędy (walidacja, błąd sieci) |
| `urgency.act_now` | fg `#A12F1B` · bg `#FBE8E2` · accent `#C2412A` | |
| `urgency.this_year` | fg `#7A4B00` · bg `#FCEFD6` · accent `#A86B12` | |
| `urgency.later` | fg `#4A5560` · bg `#ECEFF2` · accent `#78838E` | |
| `urgency.done` | fg `#276338` · bg `#E2F1E6` · accent `#3B8752` | |
| `urgency.booked` | fg `#2F4C95` · bg `#E5EBFA` · accent `#4D69B5` | |

### 2.2 Dark

Nie odwracamy palety mechanicznie: tła są ciepłym grafitem (nie czystą czernią — mniej „halo” przy dużym tekście), kolory urgency rozjaśnione i odsycone.

| Token | Hex |
|---|---|
| `bg` | `#111615` |
| `surface` | `#1A2120` |
| `surfaceAlt` | `#232B2A` |
| `border` | `#33403D` |
| `borderStrong` | `#7F8C89` |
| `text` | `#EDF1EF` |
| `textMuted` | `#B3BDBA` |
| `textSubtle` | `#949F9C` |
| `primary` | `#62C4B9` |
| `primaryPressed` | `#7FD3C9` |
| `onPrimary` | `#0B1E1C` |
| `primarySoft` | `#1D3532` |
| `focus` | `#62C4B9` |
| `danger` | `#FF8A80` |
| `urgency.act_now` | fg `#FF9F88` · bg `#3A1F19` · accent `#EE7A5E` |
| `urgency.this_year` | fg `#F2C063` · bg `#35290F` · accent `#D4A03D` |
| `urgency.later` | fg `#B9C3CB` · bg `#252B30` · accent `#8B97A2` |
| `urgency.done` | fg `#8FD3A2` · bg `#17301F` · accent `#5DB476` |
| `urgency.booked` | fg `#A9BCF4` · bg `#1C2541` · accent `#7F9BE5` |

W dark mode karty nie mają cienia — oddziela je `surface` vs `bg` + `border`.

### 2.3 Tryb senior — nadpisania kontrastu

Wymóg z `01-user-journey.md`: „wyższy kontrast”. W trybie senior podmieniamy tylko 3 tokeny (cel: tekst drugorzędny ≥ 7:1, AAA):

| Token | Light | Dark |
|---|---|---|
| `textMuted` | `#3B4649` (9.11 na `bg`, 8.35 na `surfaceAlt`) | `#CDD5D2` (12.22 / 9.68) |
| `textSubtle` | = senior `textMuted` | = senior `textMuted` |
| `borderStrong` | `#6E655B` (5.35 na `bg`) | `#98A4A1` (7.10 na `bg`) |

### 2.4 Mapa placówek — kolor markera wg czasu oczekiwania

Aliasy na `accent` z urgency (marker = element nietekstowy, ≥ 3:1 spełnione). Marker zawsze ma też liczbę tygodni w etykiecie / dymku, żeby nie polegać na kolorze.

| Alias | Kolor | Próg (propozycja UI, do potwierdzenia przez WS4/zespół) |
|---|---|---|
| `wait.short` | `urgency.done.accent` | `waitDays ≤ 14` |
| `wait.medium` | `urgency.this_year.accent` | `15–60` |
| `wait.long` | `urgency.act_now.accent` | `> 60` |
| `wait.unknown` | `urgency.later.accent` | `waitDays === null` |

> Progi to wyłącznie kategoryzacja wizualna kolejki, nie zalecenie medyczne.

## 3. Weryfikacja kontrastu (WCAG 2.x)

Metoda: współczynnik `(L1 + 0.05) / (L2 + 0.05)` z relative luminance sRGB, policzony skryptem dla wszystkich par poniżej. Progi: tekst **4.5:1** (AA, normalny rozmiar — przyjmujemy go także dla dużego tekstu, dla zapasu), elementy UI **3:1** (WCAG 1.4.11). **Wszystkie 106 sprawdzonych par przechodzi.** Zestawienie najistotniejszych (najsłabsze wartości w grupie pogrubione):

### Tekst na tłach

| Para | Light | Dark |
|---|---|---|
| `text` / `bg` · `surface` · `surfaceAlt` | 13.80 · 14.74 · 12.65 | 16.03 · 14.37 · 12.71 |
| `textMuted` / `bg` · `surface` · `surfaceAlt` | 6.67 · 7.12 · 6.11 | 9.49 · 8.50 · 7.52 |
| `textSubtle` / `bg` · `surface` · `surfaceAlt` | 5.34 · 5.71 · **4.90** | 6.70 · 6.00 · **5.31** |
| `primary` (link) / `bg` · `surface` · `surfaceAlt` | 5.88 · 6.28 · **5.39** | 8.80 · 7.89 · 6.97 |
| `danger` / `bg` · `surface` · `surfaceAlt` | 6.12 · 6.54 · 5.61 | 8.00 · 7.17 · 6.34 |
| `onPrimary` / `primary` | 6.28 | 8.31 |
| `onPrimary` / `primaryPressed` | 8.69 | 9.91 |
| `primary` / `primarySoft` | 5.19 | 6.29 |
| `text` / `primarySoft` | 12.18 | 11.46 |

### Urgency

| Urgency | `fg`/`bg` | `fg`/`surface` | `fg`/tło ekranu | `text`/`bg` | `accent`/`surface` (≥3) | `accent`/tło ekranu (≥3) |
|---|---|---|---|---|---|---|
| light `act_now` | 6.04 | 7.15 | 6.69 | 12.46 | 5.14 | 4.81 |
| light `this_year` | 6.51 | 7.41 | 6.93 | 12.96 | 4.40 | 4.11 |
| light `later` | 6.59 | 7.61 | 7.12 | 12.78 | 3.86 | **3.62** |
| light `done` | 6.13 | 7.17 | 6.71 | 12.61 | 4.40 | 4.12 |
| light `booked` | 6.80 | 8.11 | 7.59 | 12.35 | 5.25 | 4.91 |
| dark `act_now` | 7.60 | 8.24 | 9.19 | 13.26 | 5.91 | 6.60 |
| dark `this_year` | 8.47 | 9.74 | 10.87 | 12.49 | 6.94 | 7.74 |
| dark `later` | 8.00 | 9.15 | 10.21 | 12.56 | 5.49 | 6.13 |
| dark `done` | 8.12 | 9.36 | 10.45 | 12.46 | 6.44 | 7.18 |
| dark `booked` | 8.05 | 8.72 | 9.73 | 13.26 | 6.02 | 6.72 |

### Elementy UI (≥ 3:1)

| Para | Light | Dark |
|---|---|---|
| `borderStrong` / `surface` · `bg` | 4.15 · 3.88 | 4.69 · 5.23 |
| `focus` / `bg` | 5.88 | 8.80 |
| `primary` / `surface` (obrys przycisku secondary) | 6.28 | 7.89 |

`border` (dekoracyjny) celowo **nie** spełnia 3:1 — nie wolno go używać jako jedynej granicy pola formularza ani stanu zaznaczenia (do tego `borderStrong` / `primary`).

Ograniczenia: sprawdzono pary statyczne. Nie sprawdzono tekstu na kafelkach mapy ani na obrazkach — tam etykiety zawsze na `surface` (dymek/karta). Weryfikacja na urządzeniu: WS5-2 (checklista dostępności).

## 4. Typografia

**Krój:** systemowy (SF Pro / Roboto / `system-ui` na web) — zero nowych zależności, najlepszy hinting, działa w Expo Go.
Opcja do decyzji człowieka: **Atkinson Hyperlegible** (projektowany dla słabowidzących; wymaga `@expo-google-fonts/atkinson-hyperlegible` + `expo-font` → nowa zależność, AGENTS.md §6). Tokeny są od tego niezależne (`fontFamily` w jednym miejscu).

**Skale:** `normal` i `senior` = `normal × 1.3`, zaokrąglone do pełnego punktu (`Math.round`). W kodzie skala senior jest **wyliczana** z normalnej (§7), tabela poniżej jest dla projektantów.

| Wariant | Waga | normal size / lineHeight | senior size / lineHeight | Użycie |
|---|---|---|---|---|
| `display` | 700 | 32 / 40 | 42 / 52 | ekran powitalny, `done` onboardingu |
| `title` | 700 | 24 / 32 | 31 / 42 | tytuł ekranu, pytanie ankiety |
| `heading` | 600 | 20 / 28 | 26 / 36 | nagłówek sekcji, nazwa badania na karcie |
| `bodyLarge` | 400 | 18 / 26 | 23 / 34 | treść karty badania, opcje ankiety |
| `body` | 400 | 16 / 24 | 21 / 31 | tekst domyślny |
| `label` | 600 | 16 / 20 | 21 / 26 | przyciski, chipy, etykiety pól |
| `caption` | 400 | 14 / 20 | 18 / 26 | metadane, „stan na…”, źródło |

Zasady:
- Minimum na ekranie: **14 pt** (normal) / **18 pt** (senior). Nic mniejszego, także w chipach.
- Nie blokujemy `allowFontScaling` i nie ustawiamy `maxFontSizeMultiplier` — systemowe powiększenie mnoży się z trybem senior. Konsekwencja: layout **musi się zawijać** (brak stałych wysokości dla elementów z tekstem, `flexWrap` w rzędach, przyciski rosną w pionie).
- `letterSpacing`: 0 (domyślne); `display`/`title` bez ujemnego trackingu (czytelność).
- Liczby (daty, tygodnie) — `fontVariant: ['tabular-nums']` w listach placówek, żeby kolumny terminów się nie „trzęsły”.

## 5. Spacing, rozmiary, radius

### 5.1 Spacing — siatka 4 pt

| Token | px |
|---|---|
| `space.0` | 0 |
| `space.xs` | 4 |
| `space.sm` | 8 |
| `space.md` | 12 |
| `space.lg` | 16 |
| `space.xl` | 24 |
| `space.2xl` | 32 |
| `space.3xl` | 48 |

Skala spacingu jest **wspólna** dla obu trybów. Tryb senior zmienia tylko tokeny layoutu:

| Token layoutu | normal | senior | Uwagi |
|---|---|---|---|
| `layout.screenPaddingX` | 16 | 20 | |
| `layout.cardPadding` | 16 | 20 | |
| `layout.cardGap` | 12 | 16 | odstęp między kartami |
| `layout.sectionGap` | 24 | 32 | odstęp między sekcjami planu |
| `layout.minTouch` | 44 | 56 | AGENTS.md wymaga min. 44; senior większy |
| `layout.optionTileMinHeight` | 56 | 72 | `OptionTile` w ankiecie |
| `layout.maxContentWidth` | 640 | 640 | web: kolumna treści wyśrodkowana |

20 nie jest wielokrotnością 8, ale jest 4 pt — świadomie, żeby senior nie „rozdmuchał” layoutu na wąskich telefonach (360 pt).

### 5.2 Radius

| Token | px | Użycie |
|---|---|---|
| `radius.sm` | 8 | pola tekstowe, checkbox, małe ikony-przyciski |
| `radius.md` | 12 | przyciski |
| `radius.lg` | 16 | karty, `OptionTile`, arkusze |
| `radius.xl` | 24 | bottom sheet (górne rogi) |
| `radius.full` | 999 | chipy, badge, avatary |

### 5.3 Pozostałe

| Token | Wartość | Uwagi |
|---|---|---|
| `borderWidth.hairline` | 1 | separatory, karty |
| `borderWidth.strong` | 2 | pola, niezaznaczony `OptionTile`, `Button` secondary |
| `borderWidth.focus` | 3 | pierścień fokusu (web) |
| `borderWidth.accent` | 4 | pasek urgency na lewej krawędzi karty |
| `elevation.card` (light) | `shadowColor #1E2A2D`, `opacity 0.06`, `radius 8`, `offset 0/2`, Android `elevation 1` | dark: brak cienia |
| `motion.fast` | 150 ms | press, toggle |
| `motion.base` | 300 ms | wejście osi czasu (WS4-3) |
| `motion.reduced` | 0 ms | gdy `AccessibilityInfo.isReduceMotionEnabled()` |
| `icon.sm / md / lg` | 16 / 20 / 24 (senior: 20 / 26 / 32) | |

## 6. Reguły użycia (dla review WS4)

1. Komponent nie zna hexów — tylko `theme.colors.*`. Kolor urgency zawsze przez `colors.urgency[urgency]`.
2. Stan urgency = **pasek `accent` + chip (`bg` + `fg` + ikona + tekst)**. Nigdy sam kolor.
3. Jeden wypełniony przycisk `primary` na widoku. Reszta: `secondary` (obrys `primary` 2 px, tekst `primary`) lub `ghost` (sam tekst `primary`).
4. Tekst na `primarySoft` / `urgency.*.bg`: `text` albo odpowiedni `fg` — nic jaśniejszego.
5. `textSubtle` tylko do metadanych, nigdy do treści, którą trzeba przeczytać, żeby podjąć decyzję.

## 7. Gotowe do przeniesienia do TS

Proponowany kształt `apps/mobile/src/theme/tokens.ts` (WS4). Typ `Urgency` z `@naczas/shared`.

```ts
import type { Urgency } from '@naczas/shared';

interface UrgencyColor {
  fg: string;
  bg: string;
  accent: string;
}

export interface ColorTokens {
  bg: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  borderStrong: string;
  text: string;
  textMuted: string;
  textSubtle: string;
  primary: string;
  primaryPressed: string;
  onPrimary: string;
  primarySoft: string;
  focus: string;
  danger: string;
  urgency: Record<Urgency, UrgencyColor>;
}

export const colors: Record<'light' | 'dark', ColorTokens> = {
  light: {
    bg: '#FAF7F2',
    surface: '#FFFFFF',
    surfaceAlt: '#F2EDE5',
    border: '#E3DCD1',
    borderStrong: '#857B6F',
    text: '#1E2A2D',
    textMuted: '#4E5A5E',
    textSubtle: '#5F686B',
    primary: '#1C6B66',
    primaryPressed: '#155450',
    onPrimary: '#FFFFFF',
    primarySoft: '#DCEDEA',
    focus: '#1C6B66',
    danger: '#B3261E',
    urgency: {
      act_now: { fg: '#A12F1B', bg: '#FBE8E2', accent: '#C2412A' },
      this_year: { fg: '#7A4B00', bg: '#FCEFD6', accent: '#A86B12' },
      later: { fg: '#4A5560', bg: '#ECEFF2', accent: '#78838E' },
      done: { fg: '#276338', bg: '#E2F1E6', accent: '#3B8752' },
      booked: { fg: '#2F4C95', bg: '#E5EBFA', accent: '#4D69B5' },
    },
  },
  dark: {
    bg: '#111615',
    surface: '#1A2120',
    surfaceAlt: '#232B2A',
    border: '#33403D',
    borderStrong: '#7F8C89',
    text: '#EDF1EF',
    textMuted: '#B3BDBA',
    textSubtle: '#949F9C',
    primary: '#62C4B9',
    primaryPressed: '#7FD3C9',
    onPrimary: '#0B1E1C',
    primarySoft: '#1D3532',
    focus: '#62C4B9',
    danger: '#FF8A80',
    urgency: {
      act_now: { fg: '#FF9F88', bg: '#3A1F19', accent: '#EE7A5E' },
      this_year: { fg: '#F2C063', bg: '#35290F', accent: '#D4A03D' },
      later: { fg: '#B9C3CB', bg: '#252B30', accent: '#8B97A2' },
      done: { fg: '#8FD3A2', bg: '#17301F', accent: '#5DB476' },
      booked: { fg: '#A9BCF4', bg: '#1C2541', accent: '#7F9BE5' },
    },
  },
};

// Senior mode raises secondary-text contrast to AAA (>= 7:1); everything else is shared.
export const seniorColorOverrides: Record<
  'light' | 'dark',
  Pick<ColorTokens, 'textMuted' | 'textSubtle' | 'borderStrong'>
> = {
  light: { textMuted: '#3B4649', textSubtle: '#3B4649', borderStrong: '#6E655B' },
  dark: { textMuted: '#CDD5D2', textSubtle: '#CDD5D2', borderStrong: '#98A4A1' },
};

export const space = {
  0: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
} as const;

export const radius = { sm: 8, md: 12, lg: 16, xl: 24, full: 999 } as const;

export const borderWidth = { hairline: 1, strong: 2, focus: 3, accent: 4 } as const;

export const motion = { fast: 150, base: 300, reduced: 0 } as const;

export type TypeVariant =
  | 'display'
  | 'title'
  | 'heading'
  | 'bodyLarge'
  | 'body'
  | 'label'
  | 'caption';

export interface TypeStyle {
  fontSize: number;
  lineHeight: number;
  fontWeight: '400' | '600' | '700';
}

const baseType: Record<TypeVariant, TypeStyle> = {
  display: { fontSize: 32, lineHeight: 40, fontWeight: '700' },
  title: { fontSize: 24, lineHeight: 32, fontWeight: '700' },
  heading: { fontSize: 20, lineHeight: 28, fontWeight: '600' },
  bodyLarge: { fontSize: 18, lineHeight: 26, fontWeight: '400' },
  body: { fontSize: 16, lineHeight: 24, fontWeight: '400' },
  label: { fontSize: 16, lineHeight: 20, fontWeight: '600' },
  caption: { fontSize: 14, lineHeight: 20, fontWeight: '400' },
};

export const SENIOR_SCALE = 1.3;

// Senior scale is derived, not hand-written, so the two scales can never drift apart.
const scaleType = (scale: number): Record<TypeVariant, TypeStyle> =>
  Object.fromEntries(
    Object.entries(baseType).map(([variant, style]) => [
      variant,
      {
        ...style,
        fontSize: Math.round(style.fontSize * scale),
        lineHeight: Math.round(style.lineHeight * scale),
      },
    ]),
  ) as Record<TypeVariant, TypeStyle>;

export const typography = { normal: baseType, senior: scaleType(SENIOR_SCALE) } as const;

export const layout = {
  normal: {
    screenPaddingX: 16,
    cardPadding: 16,
    cardGap: 12,
    sectionGap: 24,
    minTouch: 44,
    optionTileMinHeight: 56,
    maxContentWidth: 640,
    icon: { sm: 16, md: 20, lg: 24 },
  },
  senior: {
    screenPaddingX: 20,
    cardPadding: 20,
    cardGap: 16,
    sectionGap: 32,
    minTouch: 56,
    optionTileMinHeight: 72,
    maxContentWidth: 640,
    icon: { sm: 20, md: 26, lg: 32 },
  },
} as const;

/** Map marker colour buckets by NFZ wait time — UI categorisation only, not medical advice. */
export const waitBuckets = { shortMaxDays: 14, mediumMaxDays: 60 } as const;
```

Sugerowany test (WS4, Vitest): `typography.senior.body.fontSize === 21` oraz funkcja `contrastRatio(a, b)` sprawdzająca w pętli pary z §3 — wtedy zmiana hexa, która psuje AA, wywali `pnpm check`.
