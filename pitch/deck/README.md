# Deck — prezentacja (PDF ≤ 10 slajdów)

Źródło: [`deck.html`](deck.html) — jeden plik HTML/CSS, 10 slajdów 1920×1080, bez frameworków i zależności. Treść: [`../slides-outline.md`](../slides-outline.md). Kolory i typografia: [`docs/design/tokens.md`](../../docs/design/tokens.md).

## Eksport do PDF

Automatycznie (wymaga zainstalowanego Chrome / Chromium / Brave, bez paczek npm):

```bash
node pitch/scripts/export-deck.mjs
```

Wynik: `pitch/deck/deck.pdf`. Inna przeglądarka: `CHROME_PATH=/ścieżka/do/chrome node pitch/scripts/export-deck.mjs`.

Ręcznie: otwórz `deck.html` w Chrome → Drukuj (⌘P / Ctrl+P) → *Zapisz jako PDF*, **Marginesy: brak**, zaznacz **Grafika tła**, odznacz nagłówki i stopki. Rozmiar strony bierze się z `@page` (1920×1080).

## Przed wysłaniem — podmiany

| Co | Gdzie |
|---|---|
| Nazwa produktu `{NAZWA}` | **jedno miejsce:** `--app-name` w `:root` na górze `deck.html` (wszystkie slajdy czytają ją przez klasę `.app-name`) |
| Nazwa zespołu, imiona | slajd 1 — elementy `.todo` |
| Screenshoty (po M3) | ramki `.shot` na slajdach 4, 6, 7 — zamień `<div class="shot phone">…</div>` na `<img class="shot phone" src="screens/plan.png" alt="…">` (wymiar ramki zostaje); pliki w `pitch/deck/screens/` |
| Wartości z demo | slajd 5 `{N} tyg.`, slajd 8 liczba testów i pokrycie (stan 2026-10-03: rules 123 / 100% linii, API 74 — zaktualizować z `pnpm test`), slajd 6 „Karta aktywności” — usunąć, jeśli nie działa |
| Kody QR | slajd 10 — ramki `.qr` (web demo, Expo Go, repo) |

Wszystkie placeholdery mają klasę `.todo`, `.shot` lub `.qr` — przed eksportem finalnym nie powinno ich być:

```bash
grep -nE 'class="(todo|shot|qr)|\{NAZWA\}' pitch/deck/deck.html
```

## Sprawdzone (2026-10-03)

- 10 stron, 1440×810 pt (= 1920×1080 px).
- Najmniejszy tekst na slajdzie: 28 px (czytelny z ok. 3 m); żaden element nie wychodzi poza slajd — zmierzone w headless Chrome.
- Liczby na slajdzie 2 i tabela na slajdzie 5 — źródła w `slides-outline.md` (S2, S10, tabela konkurencji).
