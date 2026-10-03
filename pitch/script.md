# Skrypt wystąpienia — 3 min

> Podział czasu wg `docs/07-pitch-and-submission.md` §Pitch na żywo, demo wg `docs/01-user-journey.md` §Scenariusz demo.
> Tempo: ~130 słów/min. Tekst mówiony to ok. 300 słów — reszta czasu to klikanie w demo.
> **[AKCJA]** = co dzieje się na ekranie. **[SLAJD n]** = przełączenie slajdu. Liczby muszą być te same co na slajdach (`slides-outline.md`).
> Ustawienia przed wejściem: Data demo = 2026-10-04, preset profili wczytany (fallback), wideo demo otwarte w drugiej karcie, telefon/laptop na zasilaniu, tryb „nie przeszkadzać”.

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
> Dlatego zrobiliśmy NaCzas: mówi, co zbadać, kiedy zacząć to organizować i gdzie zrobić to najszybciej na NFZ.

**0:35–1:15 · Onboarding mamy**
[AKCJA] D: „Dodaj bliską osobę” → Mama, 1968, kobieta → lokalizacja → historia rodzinna: rak jelita grubego → ostatnie badania: „nie pamiętam”.
**P:**
> Kasia wypełnia krótką ankietę za mamę. Jeden temat na ekran, zawsze można odpowiedzieć „nie wiem”. Całość trwa {CZAS — zmierzony na teście z osobą spoza zespołu, WS5-2; bez pomiaru powiedz tylko „kilka kroków”} — a dane zostają na telefonie, nie zakładamy żadnego konta.

**1:15–1:55 · Plan**
[AKCJA] Ekran planu, animacja osi czasu. D wskazuje czerwoną kartę.
**P:**
> To plan mamy. Na górze: „Działaj teraz”. Kolonoskopia — w okolicy czeka się około {N} tygodni, więc trzeba zacząć szukać terminu już dziś, a nie w dniu, w którym badanie powinno być zrobione.
> Mammografia — program NFZ, bez skierowania. Każde badanie ma uzasadnienie i źródło.

**1:55–2:15 · Placówki → przygotowanie → zamknięcie pętli (skrót)**
[AKCJA] „Znajdź termin” → lista placówek posortowana „najszybciej”, widoczne „stan na …” → „Zadzwoń” (nie dzwonić naprawdę — pokazać ekran wybierania) → wróć → „Umówiłam się” → data.
**P:**
> Tu są prawdziwe dane NFZ: placówki posortowane po najbliższym terminie. Jeden przycisk — dzwonimy. Umówione — aplikacja przypomni dzień przed wizytą i przeliczy kolejny termin.

> ✂️ **Jeśli brakuje czasu:** pomiń „Umówiłam się”, zostaw tylko listę placówek.
> 🔁 **Jeśli demo padnie:** „Pokażę to na nagraniu” → wideo od 0:20. Nie debuguj na scenie.

## 2:15–2:45 · Wyróżnik + technologia  [SLAJD 5 → 8]

**P:**
> Co jest nowe? Są aplikacje, które przypominają o badaniach, i jest IKP, w którym znajdziesz termin. My liczymy, **kiedy zacząć**: termin badania minus realny czas czekania w Twojej okolicy z danych NFZ, plus zapas na skierowanie.
> Technicznie: aplikacja na iOS, Androida i web, prawdziwe dane NFZ z zapasową kopią, a dane zdrowotne nigdy nie opuszczają telefonu. Reguły badań są otwarte, każda ze źródłem i przetestowana.

(~65 słów)

## 2:45–3:00 · Wdrożenie i zamknięcie  [SLAJD 9 → 10]

**P:**
> Następny krok to wspólny plan opiekuna i rodzica oraz współpraca z NFZ i samorządami — to może być publiczne, otwarte narzędzie.
> NaCzas: wiesz co, kiedy i gdzie — zanim będzie za późno. Dziękujemy.

(~40 słów)

---

## Q&A — ściąga

Pełne odpowiedzi: `docs/07-pitch-and-submission.md` §Q&A. Jedno zdanie na start, potem szczegół tylko na dopytanie.

| Pytanie | Pierwsze zdanie |
|---|---|
| Skąd zalecenia? | „Z oficjalnych programów MZ i NFZ — każda reguła ma źródło w otwartym pliku, a te jeszcze niezweryfikowane aplikacja oznacza jako orientacyjne.” |
| RODO? | „Dane zdrowotne nie opuszczają telefonu; serwer dostaje tylko nazwę świadczenia i lokalizację z dokładnością do ok. 1 km.” |
| Aktualność kolejek? | „API NFZ, aktualizacja mniej więcej co miesiąc — zawsze pokazujemy »stan na«.” |
| Czym różnicie się od Doctor Robert / IKP? | „Doctor Robert mówi, co i kiedy zbadać; IKP pozwala znaleźć termin. My łączymy jedno z drugim i mówimy, kiedy zacząć szukać, żeby zdążyć — także dla bliskich.” (Nie mówić, że IKP nie ma danych o kolejkach — ma; tabela w `slides-outline.md` slajd 5.) |
| Mammografia / cytologia nie ma w API kolejek? | „Dla programów jest osobna ścieżka: bez skierowania, link do wyszukiwarki programu; mammobusy w roadmapie.” |
| Jak użyliście AI? | „Jako narzędzia w developmencie — ujawniamy to na ostatnim slajdzie; zalecenia medyczne nie pochodzą z AI, a algorytm i architekturę tłumaczymy sami.” |
| Model biznesowy? | „Narzędzie publiczne / open source z partnerami jak NFZ i samorządy; opcjonalnie white-label dla pracodawców.” |
| Skąd liczba X na slajdzie? | Pokaż przypis — dlatego każda liczba musi mieć URL. |

## Próby (WS5-3)
- [ ] Próba 1 z zegarem — czas: ___ (cel ≤ 2:50, zapas 10 s)
- [ ] Próba 2 z zegarem, z celowo „zepsutym” demo → przejście na wideo
- [ ] Wszystkie `{…}` wypełnione wartościami z działającego demo
