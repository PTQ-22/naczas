# 07 — Pitch i zgłoszenie

## Wymagania formalne (z regulaminu)

Obowiązkowe:
- [ ] Tytuł projektu
- [ ] Nazwa zespołu
- [ ] Lista członków (1–6)
- [ ] Opis projektu
- [ ] **PDF, maks. 10 slajdów**

Opcjonalne (robimy wszystkie):
- [ ] Screenshoty
- [ ] Link do repo
- [ ] Link do demo (web build) + QR do Expo Go
- [ ] Wideo demo

Inne:
- [ ] Język: PL lub EN
- [ ] Platforma: HackTribe / Challenge Rocket (dokumenty podają obie nazwy — potwierdzić na Discordzie)
- [ ] Termin: 4.10, 23:00 — **wysyłamy do 22:00**. Zmiany po terminie nie są brane pod uwagę.
- [ ] **Ujawnienie AI i zasobów zewnętrznych** (wymóg regulaminu): narzędzia AI użyte w development, API NFZ, biblioteki open source, źródła medyczne
- [ ] Oddzielenie pracy sprzed hackathonu — u nas: brak kodu sprzed startu (tylko ta dokumentacja koncepcyjna)
- Faza 1: ocena zgłoszenia przez mentorów (min. 50% punktów) → faza 2: pitch na żywo przed jury

## Struktura slajdów (≤ 10)

| # | Slajd | Treść | Kryterium |
|---|---|---|---|
| 1 | Tytuł | Nazwa, claim: *„Wiesz co, kiedy i gdzie — zanim będzie za późno”*, zespół | — |
| 2 | Problem | Kasia i mama. Ludzie nie robią badań, bo zapominają i nie wiedzą, że trzeba planować z wyprzedzeniem (kolejki NFZ). 1–2 liczby z wiarygodnym źródłem. | Kategoria |
| 3 | Rozwiązanie | Jedno zdanie + 3 filary: plan → kiedy zacząć → gdzie na NFZ | Innowacja |
| 4 | Jak to działa | Ścieżka użytkownika: 4 screeny w rzędzie | Usability |
| 5 | Nasz wyróżnik | Algorytm lead time: `dueDate − p75(kolejki w okolicy) − bufor na skierowanie`; porównanie z konkurencją (tabela: przypomnienia ✓/✓, dane NFZ ✗/✓, opiekun ✗/✓) | Innowacja |
| 6 | Opiekun + przygotowanie do wizyty | Profile rodzinne, PDF dla lekarza POZ, karta aktywności | Kategoria |
| 7 | Design & dostępność | Tryb senior, dark mode, duże cele dotyku; screeny | Design |
| 8 | Technologia | Diagram architektury, prawdziwe dane NFZ, privacy by design (zero kont, dane na telefonie), testy silnika reguł, otwarte reguły ze źródłami | Completeness |
| 9 | Wdrożenie i roadmap | Kolejne kroki: integracja z IKP, synchronizacja E2E opiekun–rodzic, mammobusy, współpraca z NFZ/samorządami; model: open source / partner publiczny | Completeness |
| 10 | Demo + linki | QR do web demo, repo, ujawnienie AI i źródeł | — |

## Pitch na żywo (3 min)

1. **0:00–0:30** — historia Kasi (problem, emocja)
2. **0:30–2:15** — demo na żywo wg `01-user-journey.md` §Demo (zapas: wideo)
3. **2:15–2:45** — wyróżnik + technologia w jednym zdaniu każde
4. **2:45–3:00** — wdrożenie, zamknięcie

## Q&A — przygotowane odpowiedzi

- **Skąd zalecenia medyczne?** Oficjalne programy MZ/NFZ, każda reguła ze źródłem w otwartym JSON; nie diagnozujemy.
- **Co z RODO?** Dane zdrowotne nie opuszczają telefonu; API dostaje tylko nazwę świadczenia i przybliżoną lokalizację.
- **Jak aktualne są dane o kolejkach?** API NFZ, aktualizacja miesięczna, pokazujemy „stan na”; cache + snapshot fallback.
- **Czym różnicie się od Doctor Robert / IKP?** Lead time szacowany z kolejek NFZ w okolicy + gdzie na NFZ + perspektywa opiekuna.
- **Czy 29 tygodni to prawdziwy czas oczekiwania?** To szacunek, nie pierwszy wolny termin. API NFZ Terminy Leczenia podaje co miesiąc średni czas oczekiwania raportowany przez każdą poradnię (pole `average-period`; pola z datami są puste). Z placówek w okolicy bierzemy ostrożnie 75. percentyl — u 3 na 4 placówek średnie czekanie jest krótsze, więc przypomnienie raczej przyjdzie za wcześnie niż za późno. Zawsze pokazujemy „stan na”. To kolejki do poradni (zwykle ze skierowaniem), nie program przesiewowy.
- **A co z programem przesiewowym / mammografią?** Programy nie mają danych o kolejkach w API Terminy Leczenia. Dla mammografii, HPV, LDCT i bilansu „Moje Zdrowie” przypominamy ze stałym wyprzedzeniem 21 dni i linkujemy wyszukiwarkę programów; przy kolonoskopii aplikacja mówi wprost, że to kolejki do poradni, a w programie zapiszesz się bez skierowania. Następny krok (roadmap): realizatorzy programów przesiewowych z API NFZ „Umowy” — placówki i terminy dla mammografii, HPV i kolonoskopii w programie.
- **Jak użyliście AI?** Uczciwie wg sekcji ujawnienia; zespół zna i tłumaczy architekturę i algorytm.
- **Model biznesowy?** Narzędzie publiczne / open source, partnerzy: NFZ, samorządy, organizacje pacjentów; ewentualnie white-label dla pracodawców (benefit profilaktyczny).
