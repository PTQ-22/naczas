# WS1 — Silnik reguł & treści medyczne

**Właściciel:** _____ · **Katalogi:** `packages/rules`
Czytaj: `AGENTS.md` (szczególnie §7), `docs/03-contracts.md`, `docs/04-data-sources.md`, `docs/05-scheduling-algorithm.md`.

Pakiet jest **czysty**: zero I/O, zero `Date.now()`, zero zależności od React/Hono. Wejście → wyjście. Dzięki temu da się go w 100% przetestować i używać w mobile i API.

## Struktura

```
packages/rules/
├── data/exams.json          # reguły (format ExamRule)
├── src/
│   ├── index.ts             # computePlan, eligibleExams, getExamRule, mockPlan
│   ├── eligibility.ts       # wiek, płeć, requiresAny, modifiers
│   ├── schedule.ts          # dueDate, leadTime, notifyDate, urgency
│   ├── age.ts               # wiek z birthYear względem today
│   └── load-rules.ts        # parsowanie exams.json przez Zod (fail fast)
└── test/
    ├── eligibility.test.ts
    ├── schedule.test.ts
    ├── plan.test.ts         # scenariusze person (Kasia, mama)
    └── rules-data.test.ts   # walidacja całego exams.json
```

## Zadania

### WS1-1 · Weryfikacja źródeł (start T+0, równolegle z WS0)
- [ ] Dla każdej pozycji z `docs/04-data-sources.md` §D znajdź oficjalne źródło (pacjent.gov.pl / nfz.gov.pl / gov.pl program), zapisz URL
- [ ] Odhaczaj listę „Do weryfikacji” w `04-data-sources.md`
- [ ] Wartości niepotwierdzone → `"verified": false` (UI pokaże dopisek „wartość orientacyjna”)
- Agent może pomagać w wyszukiwaniu, ale **człowiek** zatwierdza każdą wartość medyczną.

### WS1-2 · `mockPlan()` (≤ 30 min, odblokowuje WS3/WS4)
- [ ] Zwraca realistyczny `Plan` dla persony „mama” (5 pozycji, każda urgency) — zgodny z typami z `@naczas/shared`

### WS1-3 · `exams.json` + walidacja
- [ ] 8–12 reguł w formacie `ExamRule`, teksty PL (prosty język, bez straszenia)
- [ ] `rules-data.test.ts`: każda reguła parsuje się przez Zod; każda ma `source.url`; `queue` ⇒ niepuste `nfzBenefits`; `program` ⇒ `programUrl`; unikalne `id`

### WS1-4 · `eligibleExams(profile, today)`
- [ ] Wiek liczony z `birthYear` względem `today` (uproszczenie: rok − rok)
- [ ] Filtrowanie: płeć, wiek, `requiresAny`, modifiers rozszerzające przedział wieku
- [ ] Testy: min. 1 pozytywny + 1 negatywny na regułę

### WS1-5 · `schedule.ts` — algorytm z `05-scheduling-algorithm.md`
- [ ] Implementacja §1–§4, stałe (`DEFAULT_QUEUE_DAYS`, bufory, clamp) w jednym miejscu i eksportowane
- [ ] **Wszystkie** przypadki testowe z §5

### WS1-6 · `computePlan()` + scenariusze
- [ ] Składa eligibility + schedule + sortowanie
- [ ] `plan.test.ts`: persona mama (58, K, rak jelita w rodzinie, nic nie pamięta) → kolonoskopia `act_now`, mammografia w planie, brak PSA; persona Kasia (34, K) → cytologia, stomatolog, brak kolonoskopii
- [ ] Pokrycie ≥ 90% (`vitest --coverage`)

### WS1-7 (stretch) · Karta aktywności
- [ ] `activityTip(profile)` → jeden „mały krok” zależny od `activity` i wieku (treść ze źródłem, np. zalecenia WHO dot. aktywności)

## Definition of Done (WS1)
`pnpm --filter @naczas/rules check` zielone, pokrycie ≥ 90%, każda reguła ma źródło, lista „Do weryfikacji” aktualna.
