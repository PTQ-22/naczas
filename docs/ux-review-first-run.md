# UX review — first-time user flow (2026-10-04)

Walkthrough on web at phone width (390×844), dark mode: demo profile (Mama/Kasia) and a fresh
profile with every optional onboarding answer skipped. Goal: make the app understandable for a
first-time user **without adding text** — fix hierarchy, consistency and flow instead.

Status legend: ☐ open · ☑ done on `ws4/first-run-ux`

## Findings

### 1. First plan after onboarding is a wall of red
Skipping "Kiedy ostatnio?" (the app says "Zostaw puste") gives 8/8 exams urgent: a hero
"Badanie u okulisty · 10.2026 · **Termin minął**" plus seven red "10.2026" rows.
- "Termin minął" is false — nothing was missed, we just don't know. The engine already returns
  `overdue: false` for unknown history; the UI used `dueDate <= today` instead.
- The hero is the first act_now item in engine order (eye exam), not the one where acting early
  matters most (colonoscopy: family history + 29-week queue).
- Profile tab badge says "Ja 8".

**Fix:** unknown ≠ overdue. Unknown-history exams get their own quiet group ("Kiedy ostatnio?")
with a one-tap inline answer that moves the exam to its real section. Hero = known act_now with
the longest queue. "Teraz" shows at most 3 rows, the rest behind "Pokaż jeszcze N".

### 2. One state, five phrasings
The same colonoscopy is "PILNE" (plan hero), "DZIAŁAJ TERAZ" (plan section, exam screen),
"Zacznij szukać: teraz", "Zacznij szukać terminu dziś", "Zrób do: 10.2026". On a fresh plan
"PILNE" and "DZIAŁAJ TERAZ" appear as two separate groups that mean the same thing.

**Fix:** one label per state everywhere — *Teraz / W tym roku / Później / Umówione / Zrobione* —
and one date ("Zrób do").

### 3. Hero number contradicts the facilities list
Plan: "**29** tygodni w kolejce". Tap "Znajdź placówkę" → first facility: **3 tyg.** The 29 is
the p75 wait (`exam-view-model.ts`), which nothing explains.

**Fix:** show a range ("3–29 tyg.") or best nearby ("od 3 tyg. · 4 km") so the number invites
the tap instead of contradicting it.

### 4. Exam details: long scroll, no hierarchy
Status, two dates, calendar link, queue number, caveat paragraph, program link, Dlaczego,
O badaniu (repeats the caveat), Jak często, Skierowanie, "Przygotuj się do wizyty u lekarza",
"Jak się przygotować" (two "prepare" items in a row that mean different things), source,
disclaimer, two footer buttons.

**Fix:** top = what to do now (name, one status, one date, a "where to go" card, one primary
button). Everything else collapsed under "Więcej o badaniu". The NFZ-clinic vs programme caveat
once, as a small label on the queue card. Visit-prep link only on the plan.

### 5. Unlabelled "− - 1m / + + 1m" under "Co 10 lat"
Changes a medically sourced interval with no explanation (AGENTS.md §7), signs doubled,
"Reset" in English, strings hardcoded in `ExamScreen.tsx` (i18n rule).

**Fix:** remove, or hide behind "Lekarz zalecił inaczej?".

### 6. Footer buttons: two of them, each ambiguous
"Znajdź placówkę" leads to a list where every row has its own "Umówiłem/am się"; the footer
also has "Umówiłem/am się". On the plan a booked exam becomes "Oznacz jako zrobione". The user
can't tell which button moves the exam forward.

**Fix:** a state-driven primary — *Znajdź placówkę → Umówiłem/am się → Zrobione* — and a small
3-step indicator (Szukam · Umówione · Zrobione) at the top of the exam screen.

### 7. Two people switchers
Folder tabs on the plan (Mama 1 / Kasia 1 / +) **and** the Rodzina tab with radios,
"AKTYWNY PROFIL" and a prominent "Usuń" on every row. Demo opens on Mama while "Ja" is Kasia.

**Fix:** plan tabs are the only switcher; Rodzina becomes "manage people" (or moves into Opcje).

### 8. Zakład contradicts itself
"Zablokuj 20 zł (Apple Pay)", "Kwota zostanie pobrana…", then "żadne prawdziwe pieniądze nie
są pobierane". "2 pilnych badań" is ungrammatical. A whole tab signals a core feature.

**Fix:** card on the plan that opens a sheet; drop Apple Pay wording or say "symbolicznie" on
the button.

### 9. Onboarding
Seven steps is fine. Skipping the location step (step 3) silently turns off all queue data
(`usePlan` only fetches with a location), yet the exam screen then says "Nie mamy aktualnych
danych o kolejce" — the real reason is the missing location. Step 7 repeats "← niedawno / dawniej →" and "Nie pamiętasz? Zostaw
puste…" under every one of 8 exams — say it once. Location is asked at step 3, before any value
is shown; ask on the first "Znajdź placówkę" instead.

## Priority

1. ☑ Unknown ≠ overdue; ≤ 3 in "Teraz"; hero by queue length (#1)
2. ☑ One status vocabulary; Szukam/Umówione/Zrobione indicator with one primary per state (#2, #6)
3. ☑ Exam screen: what-to-do-now on top, rest collapsed (#4)
4. ☑ Queue number consistent with the facility list (#3)
5. ☐ Remove ±1m; Zakład from tab to plan card (#5, #8)

Later: #7, #9.

## Notes

- Left for WS3 (their i18n files): profile badges still say "Pilne: N" / "pilne badania: N"
  (`i18n/pl/profiles.ts`, `common.ts`) — should become "Teraz: N" to match.
- For #3: a booked exam still shows "Nie mamy aktualnych danych o kolejce — zacznij szukać…"
  and the programme link; the queue block should disappear once the exam is booked.

- In the web preview, synthetic taps landed on the element below the target (tooling offset,
  not an app bug); DOM clicks route correctly. Worth a quick on-device tap check anyway.
