# Skrypt wystąpienia — 3 min

> Podział czasu wg `docs/07-pitch-and-submission.md` §Pitch na żywo, demo wg `docs/01-user-journey.md` §Scenariusz demo.
> Tempo: ~130 słów/min. Tekst mówiony to ok. 300 słów — reszta czasu to klikanie w demo.
> **[AKCJA]** = co dzieje się na ekranie. **[SLAJD n]** = przełączenie slajdu. Liczby muszą być te same co na slajdach (`slides-outline.md`).
> Ustawienia przed wejściem: Data demo = 2026-10-04, preset profili wczytany (fallback), API bez kluczy Vapi (symulacja agenta) albo z `DEMO_CALL_TO` = nasz telefon wyciszony, w kalendarzu dostępności zaznaczone popołudnia, wideo demo otwarte w drugiej karcie, telefon/laptop na zasilaniu, tryb „nie przeszkadzać”.

Role: **P** = prowadzący (mówi), **D** = osoba przy demo (klika). Jeśli jest jedna osoba — robi oba.

---

## 0:00–0:30 · Hook — historia Kasi  [SLAJD 1 → 2]

**P:**
> To jest Kasia. Ma 34 lata i — jak wielu z nas — pilnuje zdrowia swojej mamy.
> Mama ma 58 lat, a w rodzinie był rak jelita grubego. Kasia wie, że mama powinna się badać.
> Nie wie tylko: **jakie** badania, **kiedy** — i że na część z nich na NFZ czeka się tygodniami. Kiedy sobie przypomni, często jest już za późno, żeby zdążyć.
> A na kolonoskopię w połowie placówek NFZ czeka się średnio ponad cztery i pół miesiąca. *(S10: mediana 137,5–158 dni, woj. 07/06, API NFZ, stan na 2026-09)*
> I Kasia nie jest wyjątkiem: badaniami przesiewowymi w kierunku raka jelita grubego NFZ objął dotąd mniej niż co piątą uprawnioną osobę.  *(S2: 17,39%, NFZ, stan na 1.10.2026; jeśli jury dopyta — podać dokładną liczbę)*

(~75 słów)

## 0:30–2:15 · Demo na żywo  [SLAJD 3 na 5 s, potem ekran aplikacji]

**P (na slajdzie 3, 5 s):**
> Dlatego zrobiliśmy NaCzas: mówi, co zbadać, kiedy zacząć to organizować, gdzie zrobić to najszybciej na NFZ — i umówi wizytę za Ciebie.

**0:35–1:00 · Onboarding mamy**
[AKCJA] D: „Dodaj bliską osobę” → Mama, 1968, kobieta → lokalizacja → historia rodzinna: rak jelita grubego → ostatnie badania: „nie pamiętam”.
**P:**
> Kasia wypełnia za mamę krótką ankietę — kilka kroków, jeden temat na ekran, zawsze można odpowiedzieć „nie wiem”. Dane zdrowotne zostają na telefonie, bez zakładania konta.

**1:00–1:25 · Plan**
[AKCJA] Ekran planu, animacja osi czasu. D wskazuje czerwoną kartę.
**P:**
> To plan mamy. Kolonoskopia — w poradniach NFZ w okolicy czeka się średnio około 29 tygodni. To szacunek z danych, które placówki raportują do NFZ — więc terminu trzeba szukać już dziś. Każde badanie ma uzasadnienie i źródło.

**1:25–1:35 · Placówki**
[AKCJA] „Znajdź termin” → lista placówek posortowana „najszybciej”, widoczne „stan na …”.
**P:**
> Prawdziwe dane NFZ: placówki od najkrótszego średniego czasu oczekiwania.

**1:35–2:15 · Agent „Zadzwoń za mnie” — moment „wow”**
[AKCJA] D: przy pierwszej placówce „Zadzwoń za mnie” → kalendarz „Kiedy możesz przyjść” (zaznaczone wcześniej popołudnia) → „Zadzwoń”. Pierwsza próba celowo bez odpowiedzi → D klika „Zadzwoń teraz” → transkrypcja na żywo → „Umówiono na …” → wróć do planu: kolonoskopia „umówione”.
**P:**
> A teraz najtrudniejsze — dodzwonić się do rejestracji. Kasia zaznacza, kiedy mama może przyjść, i zleca telefon agentowi AI. Agent przedstawia się jako asystent AI, czeka na linii, ponawia, gdy nikt nie odbiera, i negocjuje termin w godzinach mamy. Na scenie to symulacja — w wersji demo agent dzwoni tylko na nasz numer testowy. Termin trafia do planu i do kalendarza, a aplikacja przypomni dzień wcześniej.

> ⏱ Symulacja trwa ok. 45 s (nieodebrana próba → ponowienie → rozmowa). „Zadzwoń teraz” skraca czekanie na ponowienie; mów w trakcie rozmowy, nie czytaj transkrypcji na głos.
> ✂️ **Jeśli brakuje czasu:** skróć onboarding do presetu profili i pomiń kalendarz dostępności (agent przyjmie najbliższy termin).
> 🔁 **Jeśli demo padnie:** „Pokażę to na nagraniu” → wideo od 0:20 (na nagraniu prawdziwa rozmowa na nasz numer testowy). Nie debuguj na scenie.

## 2:15–2:45 · Wyróżnik + technologia  [SLAJD 5 → 8]

**P:**
> Co jest nowe? Są aplikacje, które przypominają o badaniach, i jest IKP, w którym znajdziesz termin. My liczymy, **kiedy zacząć**: termin badania minus szacowany czas czekania w Twojej okolicy z kolejek NFZ, plus zapas na skierowanie.
> Technicznie: iOS, Android i web, prawdziwe dane NFZ z zapasową kopią, 1016 testów. Dane zdrowotne domyślnie zostają na telefonie, a agent dostaje tylko to, co potrzebne do rozmowy. Reguły badań są otwarte, każda ze źródłem.

(~60 słów)

## 2:45–3:00 · Wdrożenie i zamknięcie  [SLAJD 9 → 10]

**P:**
> Następne kroki: szyfrowany wspólny plan opiekuna i rodzica, agent umawiający przez e-rejestrację zamiast telefonu i współpraca z NFZ i samorządami — to może być publiczne, otwarte narzędzie.
> NaCzas: wiesz co, kiedy i gdzie — i zdążysz na czas. Dziękujemy.

(~40 słów)

---

## Q&A — ściąga

Pełne odpowiedzi: `docs/07-pitch-and-submission.md` §Q&A. Jedno zdanie na start, potem szczegół tylko na dopytanie.

| Pytanie | Pierwsze zdanie |
|---|---|
| Skąd zalecenia? | „Z oficjalnych programów MZ i NFZ — każda reguła ma źródło w otwartym pliku, a te jeszcze niezweryfikowane aplikacja oznacza jako orientacyjne.” |
| RODO? | „Dane zdrowotne domyślnie zostają na telefonie; serwer dostaje tylko nazwę świadczenia i lokalizację z dokładnością do ok. 1 km. Agent — tylko to, co potrzebne do rozmowy, bez nazwiska i PESEL.” Na dopytanie: synchronizacja rodzinna w demo działa na testowej bazie; docelowo szyfrowana E2E. |
| Czy agent naprawdę dzwoni do przychodni? | „Połączenie jest prawdziwe, ale w demo tylko na nasz numer testowy ustawiony na serwerze — aplikacja nie może podać innego. Na scenie pokazujemy symulację, prawdziwą rozmowę — na wideo.” |
| RODO przy rozmowie? | „Agent zna tylko relację (»mamę«), imię zlecającej osoby, badanie, placówkę i wolne godziny. Przetwarzają to Vapi, OpenAI, Deepgram, ElevenLabs i Twilio — wszystko wymieniamy w ujawnieniu.” |
| Co jeśli rejestracja odmówi / AI się pomyli? | „Agent ponawia w godzinach pracy rejestracji, odrzuca terminy poza kalendarzem i proponuje własne; użytkownik widzi transkrypcję i może jednym przyciskiem poprawić datę albo wpisać ją ręcznie.” |
| Ile kosztuje rozmowa? | „To kwestia wdrożenia i umowy z dostawcami — nie podajemy liczby bez wyceny. W kodzie: maks. 3 minuty na rozmowę i domyślnie 3 próby.” |
| Aktualność kolejek? | „API NFZ, aktualizacja mniej więcej co miesiąc — zawsze pokazujemy »stan na«.” |
| Czym różnicie się od Doctor Robert / IKP? | „Doctor Robert mówi, co i kiedy zbadać; IKP pozwala znaleźć termin. My łączymy jedno z drugim i mówimy, kiedy zacząć szukać, żeby zdążyć — także dla bliskich.” (Nie mówić, że IKP nie ma danych o kolejkach — ma; tabela w `slides-outline.md` slajd 5.) |
| Czy 29 tygodni to prawdziwy czas oczekiwania? | „To szacunek, nie pierwszy wolny termin: NFZ co miesiąc publikuje średni czas oczekiwania, który raportuje każda poradnia. Bierzemy ostrożnie 75. percentyl z placówek w okolicy — u trzech na cztery czeka się średnio krócej — i zawsze pokazujemy »stan na«.” Na dopytanie: to kolejki do poradni (zwykle ze skierowaniem), nie program przesiewowy. |
| A co z programem przesiewowym / mammografią? | „Programy nie mają danych o kolejkach w API Terminy Leczenia, więc dla mammografii, HPV, LDCT i bilansu przypominamy ze stałym wyprzedzeniem 21 dni i linkujemy wyszukiwarkę programów. Następny krok: realizatorzy programów z API NFZ »Umowy« — placówki i terminy także dla kolonoskopii w programie.” |
| Jak użyliście AI? | „W developmencie Claude Code, w aplikacji tylko agent głosowy — wszystko ujawniamy na ostatnim slajdzie i w README. Zalecenia medyczne nie pochodzą od AI, a algorytm i architekturę tłumaczymy sami.” |
| Model biznesowy? | „Narzędzie publiczne / open source z partnerami jak NFZ i samorządy; opcjonalnie white-label dla pracodawców.” |
| Skąd liczba X na slajdzie? | Pokaż przypis — dlatego każda liczba musi mieć URL. |

## Próby (WS5-3)
- [ ] Próba 1 z zegarem — czas: ___ (cel ≤ 2:50, zapas 10 s)
- [ ] Próba 2 z zegarem, z celowo „zepsutym” demo → przejście na wideo
- [ ] Wszystkie `{…}` wypełnione wartościami z działającego demo
