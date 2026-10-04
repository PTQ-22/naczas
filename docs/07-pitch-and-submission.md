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
- [ ] Termin: 4.10, 11:00 — **wysyłamy do 10:15**. Zmiany po terminie nie są brane pod uwagę.
- [ ] **Ujawnienie AI i zasobów zewnętrznych** (wymóg regulaminu): narzędzia AI użyte w development (Claude Code), usługi AI agenta głosowego (Vapi, OpenAI gpt-4o, Deepgram, ElevenLabs, Twilio), API NFZ, biblioteki open source, źródła medyczne — pełna lista w README
- [ ] Oddzielenie pracy sprzed hackathonu — u nas: pierwszy commit 3.10.2026, 16:32 (dokumentacja koncepcyjna), brak kodu sprzed startu wydarzenia
- Faza 1: ocena zgłoszenia przez mentorów (min. 50% punktów) → faza 2: pitch na żywo przed jury

## Struktura slajdów (≤ 10)

| # | Slajd | Treść | Kryterium |
|---|---|---|---|
| 1 | Tytuł | Nazwa, claim: *„Wiesz co, kiedy i gdzie — zanim będzie za późno”*, zespół | — |
| 2 | Problem | Kasia i mama. Ludzie nie robią badań, bo zapominają i nie wiedzą, że trzeba planować z wyprzedzeniem (kolejki NFZ). 1–2 liczby z wiarygodnym źródłem. | Kategoria |
| 3 | Rozwiązanie | Jedno zdanie + 4 filary: plan → kiedy zacząć → gdzie na NFZ → umówimy za Ciebie (agent AI) | Innowacja |
| 4 | Jak to działa | Ścieżka: ankieta → plan → placówki → agent dzwoni (transkrypcja na żywo) → termin w kalendarzu | Usability |
| 5 | Nasz wyróżnik | Algorytm lead time: `dueDate − p75(kolejki w okolicy) − bufor na skierowanie`; porównanie z konkurencją (tabela: przypomnienia ✓/✓, dane NFZ ✗/✓, opiekun ✗/✓, umawia wizytę za Ciebie — tylko NaCzas) | Innowacja |
| 6 | Opiekun + przygotowanie do wizyty | Profile rodzinne, PDF dla lekarza POZ, karta aktywności | Kategoria |
| 7 | Design & dostępność | Tryb senior, dark mode, duże cele dotyku; screeny | Design |
| 8 | Technologia | Diagram architektury, prawdziwe dane NFZ, privacy by design (dane zdrowotne domyślnie tylko na telefonie; do API świadczenie + lokalizacja ≈ 1 km; agent dostaje tylko to, co potrzebne do rozmowy), 1018 testów, otwarte reguły ze źródłami | Completeness |
| 9 | Wdrożenie i roadmap | Kolejne kroki: integracja z IKP, synchronizacja E2E opiekun–rodzic, agent z e-rejestracją zamiast telefonu, mammobusy, współpraca z NFZ/samorządami; model: open source / partner publiczny | Completeness |
| 10 | Demo + linki | QR do web demo, repo, ujawnienie AI i źródeł | — |

## Pitch na żywo (3 min)

1. **0:00–0:30** — historia Kasi (problem, emocja)
2. **0:30–2:15** — demo na żywo wg `01-user-journey.md` §Demo, z agentem „Zadzwoń za mnie” ok. 1:40 (zapas: wideo)
3. **2:15–2:45** — wyróżnik + technologia w jednym zdaniu każde
4. **2:45–3:00** — wdrożenie, zamknięcie

## Q&A — przygotowane odpowiedzi

- **Skąd zalecenia medyczne?** Oficjalne programy MZ/NFZ, każda reguła ze źródłem w otwartym JSON; nie diagnozujemy.
- **Co z RODO?** Bez zakładania konta; profil, historia badań i czynniki ryzyka domyślnie zostają na telefonie. Do naszego API idzie tylko nazwa świadczenia, województwo i lokalizacja zaokrąglona do ok. 1 km. Gdy użytkownik sam zleci rozmowę agentowi, do usług głosowych trafia tylko to, co potrzebne do rozmowy (niżej). Synchronizacja rodzinna działa w demo na testowej bazie; w wersji produkcyjnej dane byłyby szyfrowane end-to-end, a agent działałby na naszych serwerach.
- **Czy agent naprawdę dzwoni do przychodni?** Technicznie tak — to prawdziwe połączenie telefoniczne (Vapi + Twilio). Ale w wersji demo numer jest ustawiony na serwerze i jest to wyłącznie nasz numer testowy (`DEMO_CALL_TO`); aplikacja nie może podać innego. Na scenie pokazujemy symulację z tym samym przebiegiem; nagranie prawdziwej rozmowy — na wideo. Agent na początku mówi, że jest asystentem AI i w czyim imieniu dzwoni. Dzwonienie do prawdziwych placówek to decyzja wdrożeniowa, do uzgodnienia z placówkami.
- **Co z RODO przy rozmowie?** Agent dostaje tylko: dla kogo w formie relacji („mamę”), imię osoby zlecającej, nazwę badania, placówkę, termin „najpóźniej do” i wolne godziny. Nie zna i nie podaje PESEL, nazwiska, adresu ani telefonu — jeśli rejestracja ich potrzebuje, mówi, że pacjent poda je osobiście. Przetwarzają to Vapi, OpenAI (gpt-4o), Deepgram, ElevenLabs / Microsoft Azure (głos) i Twilio; nasze API trzyma status i transkrypcję tylko w pamięci, do 6 h. Przy wdrożeniu: umowy powierzenia z tymi dostawcami i wybór regionu UE.
- **Co jeśli rejestracja odmówi albo AI się pomyli?** Gdy nikt nie odbiera, agent ponawia (domyślnie 3 próby co 10 min) tylko w godzinach pracy rejestracji, pn–pt 7:30–18:00. Proponowany termin sprawdza z kalendarzem użytkownika: godziny „nie mogę” odrzuca i sam proponuje pasujące okno. Gdy terminów nie ma — pyta, kiedy zadzwonić ponownie, i kończy rozmowę; użytkownik widzi „Nie udało się umówić terminu” i może spróbować ponownie albo wpisać termin ręcznie. Ustalony termin agent powtarza na głos; wynik rozmowy walidujemy jak dane z zewnątrz, a użytkownik widzi całą transkrypcję i datę, którą może jednym przyciskiem poprawić („Popraw datę”). Rozmowa ma limit 3 minut. AI nie udziela porad medycznych.
- **Ile kosztuje rozmowa?** Koszt jednej rozmowy (minuty telefonii i usług głosowych) to kwestia wdrożenia i umowy z dostawcami — nie podajemy liczb bez wyceny. W kodzie ograniczamy go: maks. 3 minuty na rozmowę, domyślnie maks. 3 próby (API nie przyjmie więcej niż 5), limit 5 nowych zleceń na minutę z jednego adresu IP.
- **Jak aktualne są dane o kolejkach?** API NFZ, aktualizacja miesięczna, pokazujemy „stan na”; cache + snapshot fallback.
- **Czym różnicie się od Doctor Robert / IKP?** Lead time szacowany z kolejek NFZ w okolicy + gdzie na NFZ + perspektywa opiekuna.
- **Czy 29 tygodni to prawdziwy czas oczekiwania?** To szacunek, nie pierwszy wolny termin. API NFZ Terminy Leczenia podaje co miesiąc średni czas oczekiwania raportowany przez każdą poradnię (pole `average-period`; pola z datami są puste). Z placówek w okolicy bierzemy ostrożnie 75. percentyl — u 3 na 4 placówek średnie czekanie jest krótsze, więc przypomnienie raczej przyjdzie za wcześnie niż za późno. Zawsze pokazujemy „stan na”. To kolejki do poradni (zwykle ze skierowaniem), nie program przesiewowy.
- **A co z programem przesiewowym / mammografią?** Programy nie mają danych o kolejkach w API Terminy Leczenia. Dla mammografii, HPV, LDCT i bilansu „Moje Zdrowie” przypominamy ze stałym wyprzedzeniem 21 dni i linkujemy wyszukiwarkę programów; przy kolonoskopii aplikacja mówi wprost, że to kolejki do poradni, a w programie zapiszesz się bez skierowania. Następny krok (roadmap): realizatorzy programów przesiewowych z API NFZ „Umowy” — placówki i terminy dla mammografii, HPV i kolonoskopii w programie.
- **Jak użyliście AI?** W developmencie: Claude Code (Claude Opus 5.5) pod nadzorem zespołu. W aplikacji: tylko agent głosowy „Umów za mnie” (Vapi, OpenAI gpt-4o, Deepgram, ElevenLabs, Twilio). Zalecenia medyczne nie pochodzą od AI. Zespół zna i tłumaczy architekturę i algorytm.
- **Model biznesowy?** Narzędzie publiczne / open source, partnerzy: NFZ, samorządy, organizacje pacjentów; ewentualnie white-label dla pracodawców (benefit profilaktyczny).
