# Deck — prezentacja (PDF ≤ 10 slajdów)

Źródło: [`deck.html`](deck.html) — jeden plik HTML/CSS, 10 slajdów 1920×1080, bez frameworków i zależności. Treść: [`../slides-outline.md`](../slides-outline.md). Kolory i typografia: redesign v2 ([`docs/design/redesign.md`](../../docs/design/redesign.md), tokeny z `apps/mobile/src/theme/tokens.ts`) — kafle kobaltowe, emaliowane tabliczki, fonty Bricolage Grotesque / Atkinson Hyperlegible Next / IBM Plex Mono z Google Fonts (eksport potrzebuje internetu; skrypt czeka na fonty).

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
| Nazwa produktu (obecnie „NaCzas”) | tylko jeśli zespół wybierze inną: **jedno miejsce** — `--app-name` w `:root` na górze `deck.html` (wszystkie slajdy czytają ją przez klasę `.app-name`); poza deckiem także `README.md` (repo) i `pitch/script.md` |
| Nazwa zespołu, imiona | slajd 1 — elementy `.todo` |
| Screenshoty | slajdy 4, 6, 7: `<img class="shot-img">` z `../screenshots/v3/` (zestaw v3 z agentem, JPEG 780 px; nazwy: onboarding-light, plan-light, plan-senior, plan-dark, facilities-light, agent-light, calendar-light, family-light — dopóki plików nie ma, ramki są puste); strona 1 PDF dla lekarza → `screens/visit-prep-pdf.png` (`pdftoppm -r 150 -f 1 -l 1 -singlefile -png pitch/screenshots/m3/pdf-web-fixed.pdf pitch/deck/screens/visit-prep-pdf`). Podmiana = zmiana `src` |
| Wartości z demo | **wpisane:** slajd 5 „29” / „ok. 29 tyg.” (z ekranu planu), slajd 8 testy (stan 2026-10-04: 1013 = rules 206 / 100% linii, API 174, mobile 579, shared 54 — przy zmianie zaktualizować z `pnpm test`) |
| Kody QR | slajd 10 — ramki `.qr` (web demo, Expo Go, repo) |

Pozostałe placeholdery (zespół, kody QR) mają klasę `.todo` lub `.qr` — przed eksportem finalnym nie powinno ich być:

```bash
grep -nE 'class="(todo|qr)"' pitch/deck/deck.html
```

## Sprawdzone (2026-10-03)

- 10 stron, 1440×810 pt (= 1920×1080 px); PDF ok. 2,7 MB (screenshoty).
- Najmniejszy tekst na slajdzie: 28 px (czytelny z ok. 3 m); żaden element nie wychodzi poza slajd — zmierzone w headless Chrome.
- Liczby na slajdzie 2 i tabela na slajdzie 5 — źródła w `slides-outline.md` (S2, S10, tabela konkurencji).

## Zmiany 2026-10-04 (agent AI, uczciwa prywatność)

- Slajd 3: 4. filar „Umówimy za Ciebie”; slajd 4: 5 kroków (ankieta → plan → placówki → rozmowa agenta → kalendarz); slajd 5: wiersz „Umawia wizytę za Ciebie” (wiersze tabeli ciaśniej, żeby 7 wierszy zmieściło się nad stopką przy 28 px).
- Slajd 8: zamiast „zero danych zdrowotnych na serwerze” — co faktycznie wychodzi z telefonu (API: świadczenie + lokalizacja; agent: dla kogo, badanie, placówka, wolne godziny — zgodnie z `apps/api/src/call-assist/assistant.ts`). Punkt „Otwarte reguły” usunięty z braku miejsca.
- Slajd 10: ujawnienie AI w aplikacji (Vapi, OpenAI gpt-4o, ElevenLabs, Deepgram, Twilio). Synchronizacja rodzinna wyłączona w demo — tylko roadmapa.
- Sprawdzone w headless Chrome: 10 stron, min. tekst 28 px, nic nie wychodzi poza slajd ani nie wchodzi na stopkę.
