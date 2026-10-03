# Redesign v2 — „Numerek”

> Brief od zespołu: obecny design „wygląda na LLM slop”. Diagnoza i nowy kierunek.
> Skille: `frontend-design` (kierunek), `expo:expo-native-ui` (wykonanie w Expo).

## 1. Diagnoza — dlaczego obecny UI wygląda generycznie

| Objaw | Gdzie | Dlaczego to „slop” |
|---|---|---|
| Kremowe tło `#FAF7F2` + morski turkus + terakotowy akcent | `theme/tokens.ts` | Dokładnie najczęstszy domyślny look generowany przez AI („warm cream + terracotta”). Nie mówi nic o NFZ, kolejkach ani zdrowiu. |
| Systemowy krój wszędzie | cała aplikacja | Zero osobowości; typografia nie niesie żadnej informacji. |
| Każdy element to biała karta z cieniem i kolorowym paskiem po lewej | plan, karta badania, rodzina | „Kartoza” — wszystko ma tę samą wagę wizualną, nic nie jest najważniejsze. |
| Podwójne etykiety: nagłówek sekcji „Działaj teraz” **i** chip „Działaj teraz” na karcie | plan | Ta sama informacja dwa razy = szum. |
| Emoji/unicode jako ikony (▦ ☺ ⚙ ◷ ↗) | tab bar, karty | Wygląda jak prototyp; nie natywnie. |
| Najważniejsza liczba produktu („29 tyg.”) jest zwykłym tekstem w zdaniu | karta w planie | Nasz wyróżnik ginie w akapicie. |

## 2. Temat i sygnatura

**Świat przedmiotu:** polska przychodnia NFZ — automat z **numerkami** do kolejki, papierowe skierowanie, pieczątka, zakreślacz w kalendarzu.

**Sygnatura (jedyny „głośny” element): bilet z kolejki.** Najpilniejsze badanie na górze planu wygląda jak wydrukowany numerek z automatu: perforowana krawędź (ząbki z półkoli po bokach), ogromna liczba tygodni czekania w kroju monospace jak z drukarki termicznej, pod nią mały opis. Ta liczba to nasz wyróżnik („ile się czeka → kiedy zacząć”), więc dostaje centralne miejsce. Wszystko inne jest ciche.

```
┌────────────────────────────────────┐
│ KOLONOSKOPIA            NFZ · 00-950│
│                                    │
│   29                               │   ← IBM Plex Mono, 96 pt, tabular
│   TYGODNI W KOLEJCE                │   ← mono, 12 pt, letter-spacing
│                                    │
│ ◖ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ◗ │   ← perforacja (półkola wycięte w kolorze tła)
│ Zacznij szukać terminu dziś,       │
│ żeby zdążyć do X 2026.             │
│ [  Znajdź placówkę  ]              │
└────────────────────────────────────┘
```

## 3. Tokeny

### Kolor (light) — „ściana przychodni + atrament pieczątki”

| Token | Hex | Rola |
|---|---|---|
| `bg` „Ściana” | `#E9EEF2` | chłodny, jasny szaroniebieski — tło ekranów (NIE krem) |
| `surface` „Papier” | `#FFFFFF` | bilet, arkusze |
| `ink` „Atrament” | `#0E1B2C` | tekst główny, granatowy jak tusz pieczątki |
| `inkMuted` | `#4A5A6E` | tekst drugorzędny (≥ 4.5:1 na bg i surface — zweryfikować testem) |
| `stamp` „Pieczątka” (primary) | `#1F3FD1` | przyciski, linki, focus — kobaltowy tusz |
| `marker` „Zakreślacz” | `#FFE24A` | wyłącznie tło pod pilną datą/liczbą (jak zakreślenie w kalendarzu); nigdy tekst |
| `act_now` | fg `#B4231A` / accent `#E0352B` | pilne — czerwień automatu z numerkami |
| `booked` | fg `#1F3FD1` | umówione = kolor pieczątki („przybite”) |
| `done` | fg `#17734A` | zrobione |
| `later` | fg `#4A5A6E` | później = zwykły atrament, bez koloru |

Dark: `bg #0B1320`, `surface #131D2C`, `ink #E8EEF5`, `stamp #8EA2FF`, marker zostaje żółty, ale tylko jako 3-px podkreślenie zamiast tła.

### Typografia — 3 role (`@expo-google-fonts/*` + `expo-font`, działa w Expo Go i web)

| Rola | Krój | Uzasadnienie |
|---|---|---|
| Display (tytuły ekranów, nazwy badań) | **Bricolage Grotesque** 700/800, lekko zwężony | charakter, czytelny po polsku, nie jest „domyślnym” Inter/SF |
| Body | **Atkinson Hyperlegible Next** 400/700 | krój projektowany dla osób słabowidzących (Braille Institute) — **realny argument dla trybu senior**, nie ozdobnik |
| Utility (liczby, daty, numerek, kody) | **IBM Plex Mono** 500/600, `tabular-nums` | drukarka termiczna automatu z numerkami; wszystkie liczby w aplikacji tym krojem |

Skala (normal → senior ×1.3): numerek 96, h1 32, h2 22, body 17, caption 13 (mono, uppercase, +0.8 letter-spacing).

### Kształt i głębia
- Radius 14 `borderCurve: 'continuous'` dla arkuszy; bilet ma 6 + perforację.
- Cienie tylko `boxShadow` (expo-native-ui), 1 poziom: `0 1px 0 rgba(14,27,44,.06), 0 8px 24px -12px rgba(14,27,44,.18)` — wyłącznie bilet. Reszta płaska, oddzielona separatorami.

## 4. Układ ekranów

**Plan** (najważniejszy):
```
[Mama ●1] [Kasia ●1] [+]          ← zakładki jak przekładki teczki, nie pigułki
Plan badań                         ← tytuł w nagłówku Stack (expo-native-ui)
┌ BILET (najpilniejsze) ───────┐   ← sygnatura, tylko 1 sztuka
└──────────────────────────────┘
UMÓWIONE                           ← caption mono
 Mammografia ............ 17.10   ← wiersz listy, data w mono, bez karty
TEN ROK
 Okulista ................. XII
PÓŹNIEJ (4) ›                      ← zwinięte
ZROBIONE (1) ›
— Mały krok: krótki spacer —       ← jeden cichy wiersz, nie karta
```
Zasady: **jedna karta (bilet) na ekran, reszta to lista z separatorami.** Brak chipów dublujących nagłówki sekcji. Pozostałe pilne badania (jeśli >1) jako mniejsze „numerki” w poziomym rzędzie pod biletem.

**Karta badania:** nagłówek = nazwa (display). Pod nim ten sam bilet w wersji kompaktowej (tygodnie + promień). Dalej sekcje jako zwykły tekst z nagłówkami caption-mono, bez kart. CTA przyklejone do dołu.

**Placówki:** lista wierszy: po lewej numerek tygodni w mono (jak pozycja na tablicy), po prawej nazwa/adres/odległość; „Zadzwoń” jako ikona-przycisk 44 pt.

**Onboarding:** tło `bg`, jedno pytanie na ekran, display 32 pt, opcje jako pełnoszerokie wiersze z radiem — bez kart z cieniem.

## 5. Ikony i detale
- Zamiast emoji/unicode: `expo-image` z `source="sf:…"` na iOS (expo-native-ui) + `@expo/vector-icons` (Ionicons) jako fallback na Android/web, jedna owijka `Icon`.
- `expo-haptics` (iOS) przy „Oznacz jako zrobione” i zapisie wizyty.
- Animacja tylko jedna: bilet „wysuwa się” z góry przy pierwszym wejściu na plan (respektuj reduce motion). Reszta bez animacji.

## 6. Copy
- Bilet: „29 / TYGODNI W KOLEJCE” + „Zacznij szukać terminu dziś, żeby zdążyć do X 2026.” — konkret, bez „zacznij szukać teraz.” po myślniku.
- Przyciski nazywają akcję: „Znajdź placówkę”, „Zapisz wizytę”, „Oznacz jako zrobione” → toast „Oznaczono jako zrobione”.

## 7. Czego NIE robić
- Kremowego tła, terakoty, turkusu (stary look).
- Kolorowego paska po lewej każdej karty.
- Więcej niż jednego elementu z cieniem na ekranie.
- Gradientów „dla efektu”.

## 8. Weryfikacja
- Testy kontrastu w `theme/__tests__/tokens.test.ts` zaktualizowane do nowych par (AA, senior ≥ 7:1 dla tekstu drugorzędnego).
- Screenshoty przed/po: plan, karta badania, placówki, onboarding — light, dark, senior.
