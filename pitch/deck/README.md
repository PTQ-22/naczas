# Deck — prezentacja (PDF ≤ 10 slajdów)

Źródło: [`deck.html`](deck.html) — jeden plik HTML/CSS, 10 slajdów 1920×1080, bez frameworków i zależności. Treść: [`../slides-outline.md`](../slides-outline.md). Kolory i typografia: redesign v2 ([`docs/design/redesign.md`](../../docs/design/redesign.md), tokeny z `apps/mobile/src/theme/tokens.ts`) — kafle kobaltowe, emaliowane tabliczki, fonty Bricolage Grotesque / Atkinson Hyperlegible Next / IBM Plex Mono z Google Fonts (eksport potrzebuje internetu; skrypt czeka na fonty).

## Eksport do PDF

Automatycznie (wymaga zainstalowanego Chrome / Chromium / Brave, bez paczek npm):

```bash
node pitch/scripts/export-deck.mjs
```

Wynik: `pitch/deck/deck.pdf`. Inna przeglądarka: `CHROME_PATH=/ścieżka/do/chrome node pitch/scripts/export-deck.mjs`.

Ręcznie: otwórz `deck.html` w Chrome → Drukuj (⌘P / Ctrl+P) → *Zapisz jako PDF*, **Marginesy: brak**, zaznacz **Grafika tła**, odznacz nagłówki i stopki. Rozmiar strony bierze się z `@page` (1920×1080).

## Co jest gdzie

| Co | Gdzie |
|---|---|
| Nazwa produktu („NaCzas”) | jedno miejsce w decku: `--app-name` w `:root` na górze `deck.html` (slajdy czytają ją przez klasę `.app-name`); poza deckiem także `README.md` (repo), `pitch/script.md` i okładka `pitch/cover/cover.html` |
| Screenshoty | slajdy 4, 6, 7: `<img class="shot-img">` z `../screenshots/v3/` (JPEG 780 px, 390×844 @2x). Plan na slajdzie 4 to `plan-demo-light.jpg` — profil demo („Wczytaj profil demo”), ten sam co na okładce. Podmiana = zmiana `src` |
| Wartości z demo | slajdy 1 i 5: „9–19” tyg. dla kolonoskopii — ekran planu profilu demo Mamy (Poznań): najszybsza placówka w okolicy – p75, dane NFZ z 2026-10-04. Mammografia na slajdzie 1: 18.10 (demo umawia ją na dziś + 14 dni) |
| Kody QR | slajd 10: `qr/qr-demo.svg` (naczas-web.onrender.com) i `qr/qr-repo.svg` (github.com/PTQ-22/naczas) |
| Źródła liczb | slajd 2 i tabela konkurencji na slajdzie 5 — `../slides-outline.md` (S2, S10, tabela konkurencji) |

## Sprawdzone (2026-10-04)

- 10 stron 1920×1080, PDF ok. 2,3 MB.
- Slajdy 1, 4 i 5 po zmianie na „9–19”: nic nie wychodzi poza slajd ani nie wchodzi na stopkę.
- Slajdy 2, 3, 5, 8, 9 po poprawkach (jednostka „mies.”, nagłówek slajdu 3, ujednolicone karty, podświetlenie ostatniego wiersza tabeli, synchronizacja rodzinna tylko jako „opcjonalna”): nic nie wychodzi poza slajd.
