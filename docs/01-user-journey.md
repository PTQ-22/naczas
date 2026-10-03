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

Jeden temat na ekran, duże przyciski, zawsze opcja „Nie wiem / pomiń”.

1. **Dla kogo?** Ja / Bliska osoba (imię, relacja)
2. **Rok urodzenia, płeć**
3. **Lokalizacja:** zgoda na GPS *albo* kod pocztowy → województwo + współrzędne
4. **Choroby przewlekłe:** cukrzyca, nadciśnienie, choroby serca, inne (multi-select)
5. **Historia rodzinna:** rak piersi, jelita grubego, prostaty, jajnika; zawał/udar przed 60 r.ż. (multi-select)
6. **Styl życia:** palenie (nigdy / kiedyś / obecnie + paczkolata w uproszczeniu), aktywność (0–1 / 2–3 / 4+ dni w tygodniu), wzrost/waga (opcjonalnie)
7. **Ostatnie badania:** lista badań wynikająca z kroków 1–6, dla każdego: „rok temu / 2–3 lata / dawniej / nigdy / nie pamiętam”

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

1. **Hook (20 s):** „Kasia wie, że mama powinna się badać. Nie wie, co, kiedy ani gdzie — i że na kolonoskopię czeka się 3 miesiące.”
2. **Onboarding mamy (40 s):** 58 lat, kobieta, rak jelita w rodzinie, nie pamięta ostatnich badań.
3. **Plan (40 s):** oś czasu. Czerwona karta: *„Kolonoskopia — w Twojej okolicy czeka się ~10 tyg. Zacznij szukać teraz.”* Mammografia: „bez skierowania, program NFZ”.
4. **Placówki (30 s):** mapa, 5 placówek posortowanych po pierwszym terminie, dane „stan na 2026-09”. Klik „Zadzwoń”.
5. **Przygotowanie do wizyty (20 s):** „Poproś lekarza rodzinnego o skierowanie na…” + podsumowanie PDF.
6. **Zamknięcie pętli (20 s):** „Umówione na 12.01” → przewiń czas → powiadomienie dzień przed → „Zrobione” → następne za 10 lat.
7. **Kasia (10 s):** przełączenie na własny profil — cytologia, stomatolog, karta aktywności.

## Wymagania niefunkcjonalne UX

- Ankieta < 2 min (mierzymy na teście z kimś spoza zespołu).
- Tryb senior: typografia ×1.3, wyższy kontrast, mniej elementów na kartę.
- Dark mode.
- Działa offline (plan liczony lokalnie); placówki wymagają sieci, z cache ostatniego wyniku.
