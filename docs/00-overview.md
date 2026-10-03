# 00 — Overview

## Problem

Ludzie nie robią badań profilaktycznych, bo:
1. **nie pamiętają**, kiedy ostatnio je robili i jak często powinni,
2. **nie wiedzą**, które badania ich dotyczą (wiek, płeć, historia rodzinna),
3. **przypominają sobie za późno** — na wiele świadczeń NFZ czeka się tygodniami/miesiącami,
4. **nie wiedzą, gdzie** zrobić badanie najszybciej w okolicy,
5. dodatkowo **opiekują się zdrowiem rodziców**, którzy sami tego nie pilnują.

Istniejące rozwiązania działają osobno: Doctor Robert tworzy plan badań i przypomina, a IKP/pacjent.gov.pl pokazuje kolejki NFZ i pozwala się zapisać. Żadne nie łączy **osobistego planu profilaktyki** z danymi o kolejkach, żeby powiedzieć, *kiedy zacząć szukać terminu* (szczegóły i źródła: `pitch/slides-outline.md`, slajd 5).

## Grupa docelowa (persona)

**Kasia, 34 lata** — pracuje, sama „ogarnia” zdrowie swojej mamy.
**Mama Kasi, 58 lat** — niechętnie korzysta z aplikacji, nie pamięta dat badań, w rodzinie był rak jelita grubego.

Potrzeba: *„Chcę w jednym miejscu wiedzieć, co mama i ja powinnyśmy zbadać, i dostać sygnał na tyle wcześnie, żeby zdążyć umówić się na NFZ.”*

## Propozycja wartości

> Mówimy nie tylko **jakie** badanie i **kiedy**, ale też **kiedy zacząć je organizować** i **gdzie** zrobić je na NFZ najszybciej — dla Ciebie i Twoich bliskich.

## Zakres

### MVP (musi działać na demo)
- [ ] Ankieta wstępna (< 2 min) dla siebie i dla bliskiej osoby (wiele profili na jednym urządzeniu)
- [ ] Silnik reguł → indywidualny plan badań (8–12 badań) z uzasadnieniem i źródłem
- [ ] Algorytm „kiedy zacząć szukać” oparty o realne kolejki NFZ
- [ ] Lista + mapa placówek NFZ dla badania (API Terminy Leczenia), przycisk „Zadzwoń”
- [ ] Ścieżka dla badań programowych bez kolejki (mammografia, cytologia, bilans „Moje Zdrowie”)
- [ ] Statusy: zaplanowane → umówione (data) → zrobione; przeliczenie kolejnego terminu
- [ ] Lokalne powiadomienia + tryb „przewiń czas” na demo
- [ ] Przygotowanie do wizyty: podsumowanie dla lekarza POZ („proszę o skierowanie na…”) jako ekran/PDF
- [ ] Web build pod link dla jury

### Stretch (jeśli starczy czasu, w tej kolejności)
1. Karta aktywności: pytanie w ankiecie → spersonalizowany „mały krok” (np. 20 min spaceru)
2. Import kroków/tętna z Health Connect / HealthKit (wymaga dev builda)
3. Eksport do kalendarza (.ics)
4. Motywacja: licznik „bez zaległości”, wspólny cel rodzinny; kaucja na cel charytatywny jako mock
5. Synchronizacja opiekun ↔ rodzic (E2E szyfrowana) — tylko slajd „roadmap”, chyba że zostanie dużo czasu
6. Harmonogram mammobusów

### Poza zakresem
- Rezerwacja wizyt w aplikacji, integracja z IKP / P1, prywatna opieka zdrowotna, konta użytkowników, diagnozowanie.

## Mapowanie na kryteria jury

| Kryterium | Waga | Jak punktujemy |
|---|---|---|
| Idea & Innovation | 30% | Połączenie planu profilaktyki z **realną dostępnością NFZ** i „lead time”. Perspektywa opiekuna. Privacy by design (zero kont, dane na telefonie). |
| Relation to Category | 20% | Bezpośrednio realizuje kierunki z treści: „przygotowanie do wizyt”, „dzielenie się z opiekunami”, „osiągalny następny krok”. Karta aktywności łączy z „sport”. |
| Practical Applicability / Usability | 20% | Prawdziwe dane NFZ, ankieta < 2 min, jeden jasny CTA na ekranie, tryb senior, przycisk „Zadzwoń”. |
| Design | 20% | Dedykowana osoba (WS4/WS5), spójny design system, oś czasu jako „wow moment”. |
| Completeness & Implementation Value | 10% | Działające demo (mobile + web link), testy silnika reguł, otwarte reguły ze źródłami, plan wdrożenia na slajdzie. |
