# 01 — User journey i ekrany

## Mapa ekranów (expo-router)

```
app/
├── _layout.tsx                 # providers, theme, fonts
├── index.tsx                   # redirect: onboarding jeśli brak profili, inaczej /plan
├── onboarding/
│   ├── welcome.tsx             # value prop + prywatność + disclaimer
│   ├── [step].tsx              # kroki ankiety (1..N), jeden temat na ekran
│   └── done.tsx                # animowane przejście do planu
├── (tabs)/
│   ├── plan.tsx                # oś czasu dla aktywnego profilu + przełącznik profili
│   ├── family.tsx              # profile (ja, mama, …), dodaj osobę
│   └── settings.tsx            # tryb senior, lokalizacja, „przewiń czas” (demo), reset
├── exam/[examId].tsx           # karta badania: dlaczego, jak często, skierowanie, status, CTA
├── exam/[examId]/facilities.tsx# lista + mapa placówek NFZ, sortowanie, „Zadzwoń”
├── exam/[examId]/book.tsx      # „Umówiłem/am na …” (date picker)
└── visit-prep.tsx              # podsumowanie dla lekarza POZ (ekran + PDF/druk)
```

## Ankieta (kroki)

Jeden temat na ekran, duże przyciski. **Każde pytanie zmienia plan, podsumowanie dla lekarza albo wyszukiwanie placówek** — pytamy tylko wtedy, gdy przy danym wieku i płci odpowiedź może coś zmienić (logika: `apps/mobile/src/features/onboarding/survey.ts`). Źródła: `docs/research/exams-verified.md`.

| Krok | Pytanie (kiedy je pokazujemy) | Odpowiedź → skutek |
|---|---|---|
| 1 | **Dla kogo?** Ja / Bliska osoba (imię, relacja) | Nazwa profilu i forma zwracania się; zaleceń nie zmienia |
| 2 | **Rok urodzenia, płeć** (obowiązkowe) | Wszystkie badania zależne od wieku i płci |
| 3 | **Lokalizacja:** GPS *albo* kod pocztowy. Przycisk „Pomiń” (bez „Nie wiem”), znika po wybraniu | Placówki i czasy oczekiwania; plan bez zmian |
| 4 | **Rozpoznane choroby** — tylko pasujące opcje; brak opcji → krok znika | cukrzyca / przewlekła choroba nerek / rodzinna hipercholesterolemia / choroba serca lub naczyń (35–65 lat) → **wyłącza ChUK** · zakażenie HIV lub leki immunosupresyjne (K 25–64) → **test HPV co 12 mies.** |
| 5 | **Nowotwory w rodzinie** (rodzice, rodzeństwo, dzieci) | rak jelita grubego → **kolonoskopia od 40 r.ż.** · każdy z: jelito grube, pierś, jajnik, trzon macicy → **pytanie o poradnię genetyczną** w przygotowaniu do wizyty |
| 6 | **Palenie i ruch:** palenie nigdy / kiedyś / obecnie | obecnie → **+ program chorób odtytoniowych** (40–65 bez POChP: + spirometria) |
| 6a | Kiedy rzucone: ≤ 15 / > 15 lat (byli palacze) | > 15 lat → brak tomografii płuc |
| 6b | Paczkolata (50–74 lata, palący lub rzucone ≤ 15 lat) | ≥ 20 i 55–74 lata → **+ niskodawkowa TK płuc co 12 mies.** |
| 6c | POChP (palący 40–65 lub ścieżka TK 50–54) | wyłącza spirometrię; liczy się jako czynnik ryzyka do TK w wieku 50–54 |
| 6d | Inny czynnik ryzyka raka płuca (50–54 lata, ≥ 20 paczkolat, bez POChP) | tak → **+ TK płuc** |
| 6e | Aktywność fizyczna | Wskazówka w karcie „Ruch” (nie zmienia badań) |
| 7 | **Kiedy ostatnio?** — tylko badania z planu; przedziały z interwału badania (np. kolonoskopia: „W ciągu ostatnich 5 lat / 5–10 lat temu / Ponad 10 lat temu”) | Termin następnego badania (`docs/05-scheduling-algorithm.md` §1) |

Usunięte w wersji 2 (nic nie zmieniały): nadciśnienie, „inne” choroby, rak prostaty i zawał/udar w rodzinie, wzrost i waga. Zapisane wcześniej odpowiedzi usuwa migracja store'ów (v1 → v2).

> Krok 7 generowany dynamicznie przez silnik reguł — pytamy tylko o badania, które dotyczą danej osoby.

## Ekran planu — zasady UX

- Sekcje: **🔴 Działaj teraz** (notifyDate ≤ dziś) · **🟡 W tym roku** · **⚪ Później** · **✅ Zrobione**.
- Karta badania: nazwa, „do kiedy”, jedna linijka uzasadnienia, **jeden CTA**:
  - `queue` → „Znajdź termin (czeka się ~10 tyg.)”
  - `program` → „Gdzie zrobić bez skierowania”
  - `walk_in` → „Bez zapisów — oznacz jako zrobione”
- Przełącznik profili na górze (avatar + imię). Badge z liczbą pilnych na profilu bliskiej osoby.

## Scenariusz demo (3 min, musi działać end-to-end)

Tryb demo: `settings → Data demo = 2026-10-04`, preset profili można wczytać jednym przyciskiem (fallback, gdyby ankieta zawiodła na scenie).

1. **Hook (20 s):** „Kasia wie, że mama powinna się badać. Nie wie, co, kiedy ani gdzie — i że na kolonoskopię w połowie placówek NFZ czeka się średnio ponad 4,5 miesiąca.” *(mediana `average-period` z API NFZ, stan na 2026-09: 137,5 dnia mazowieckie, 158 dni małopolskie — `pitch/slides-outline.md` S10)*
2. **Onboarding mamy (40 s):** 58 lat, kobieta, rak jelita w rodzinie, nie pamięta ostatnich badań.
3. **Plan (40 s):** oś czasu. Czerwona karta: *„Kolonoskopia — w Twojej okolicy czeka się ~10 tyg. Zacznij szukać teraz.”* Mammografia: „bez skierowania, program NFZ”.
4. **Placówki (15 s):** lista placówek posortowanych po średnim czasie oczekiwania, dane „stan na 2026-09”.
5. **Agent „Zadzwoń za mnie” (40 s, ok. 1:40 pitchu):** przy placówce „Zadzwoń za mnie” → kalendarz „Kiedy możesz przyjść” (popołudnia zaznaczone przed pitchem) → „Zadzwoń” → pierwsza próba bez odpowiedzi → „Zadzwoń teraz” → transkrypcja na żywo: agent przedstawia się jako asystent AI, odrzuca proponowane 10:30 i proponuje termin z kalendarza → „Umówiono na …” → w planie kolonoskopia „umówione”, „Dodaj do kalendarza”. Na scenie symulacja (API bez kluczy Vapi); prawdziwa rozmowa tylko na numer testowy zespołu (`DEMO_CALL_TO`) — na wideo. Symulacja trwa ok. 45 s.
6. **Przygotowanie do wizyty (15 s):** „Poproś lekarza rodzinnego o skierowanie na…” + podsumowanie PDF.
7. **Zamknięcie pętli (15 s):** przewiń czas → powiadomienie dzień przed wizytą umówioną przez agenta → „Zrobione” → następne za 10 lat.
8. **Kasia (10 s):** przełączenie na własny profil — cytologia, stomatolog, karta aktywności.

> Pitch 3 min (`pitch/script.md`) pokazuje kroki 1–5; kroki 6–8 — na wideo albo w Q&A.

## Wymagania niefunkcjonalne UX

- Ankieta < 2 min (mierzymy na teście z kimś spoza zespołu).
- Tryb senior: typografia ×1.3, wyższy kontrast, mniej elementów na kartę.
- Dark mode.
- Działa offline (plan liczony lokalnie); placówki wymagają sieci, z cache ostatniego wyniku.
