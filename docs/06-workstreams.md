# 06 — Podział pracy

Każdy workstream (WS) ma **jednego człowieka-właściciela**, który może delegować zadania agentom AI. Agent pracuje zawsze w ramach jednego WS i jego katalogów (`AGENTS.md` §6).

## Workstreamy

| WS | Nazwa | Katalogi | Brief | Profil osoby |
|---|---|---|---|---|
| WS0 | Setup & integracja | root config, `packages/shared`, CI | [ws0-setup.md](workstreams/ws0-setup.md) | najbardziej doświadczony dev; potem tech lead / integrator |
| WS1 | Silnik reguł & treści medyczne | `packages/rules` | [ws1-rules.md](workstreams/ws1-rules.md) | dev TS + osoba skrupulatna do weryfikacji źródeł |
| WS2 | API NFZ | `apps/api` | [ws2-api.md](workstreams/ws2-api.md) | backend |
| WS3 | Mobile core | `apps/mobile/src/{store,services,features/onboarding,features/profiles,notifications}` | [ws3-mobile-core.md](workstreams/ws3-mobile-core.md) | RN / frontend |
| WS4 | Mobile UI & design system | `apps/mobile/src/{theme,components,features/plan,features/facilities,features/visit-prep}` | [ws4-mobile-ui.md](workstreams/ws4-mobile-ui.md) | frontend z wyczuciem designu |
| WS5 | Design, pitch, QA | `docs/`, `pitch/`, Figma | [ws5-pitch-qa.md](workstreams/ws5-pitch-qa.md) | designer / PM / osoba prezentująca |

**Mniejszy zespół:**
- 4 osoby: WS0+WS2 jedna osoba, WS3+WS4 dzielone przez dwie, WS5 łączy się z WS1.
- 3 osoby: WS0/WS2, WS1/WS5, WS3/WS4. Agenci przejmują więcej zadań implementacyjnych.

## Zależności

```
WS0 (setup + kontrakty, T+0–2h) ──┬──► WS1 rules ──┐
                                  ├──► WS2 api ────┼──► Integracja (T+12–16h) ──► Polish ──► Freeze
                                  ├──► WS3 core ───┤
                                  └──► WS4 UI ─────┘
WS5 od T+0: design tokens + makiety (input dla WS4), potem pitch równolegle
```

Odblokowanie pracy równoległej przed gotowymi zależnościami:
- WS3/WS4 używają **mocków**: `packages/rules` eksportuje `mockPlan()`, `apps/mobile/src/services/api.mock.ts` zwraca fixtures z `apps/api/test/fixtures`. Przełącznik `EXPO_PUBLIC_USE_MOCKS=1`.
- WS2 od początku nagrywa fixtures z prawdziwego NFZ → służą jednocześnie do testów API i mocków w mobile.

## Harmonogram (24h, T = start oficjalny)

| Okno | Cel | Kamień milowy (gate) |
|---|---|---|
| T+0 – T+2 | WS0 scaffold + `packages/shared` z kontraktami + CI. WS1 zaczyna weryfikację źródeł. WS5 makiety kluczowych 4 ekranów + tokeny. WS2 nagrywa fixtures NFZ. | **M0:** `pnpm check` zielone na pustym monorepo, kontrakty zmergowane |
| T+2 – T+8 | Praca równoległa na mockach | **M1:** onboarding → plan na mockach; `/v1/facilities` działa na fixtures; `computePlan` z 5 badaniami i testami |
| T+8 – T+12 | Dokończenie funkcji MVP | **M2:** wszystkie funkcje MVP zrobione osobno |
| T+12 – T+16 | Integracja: prawdziwe API, prawdziwy silnik, deploy API + web | **M3:** scenariusz demo przechodzi end-to-end na telefonie i na web linku |
| T+16 – T+20 | Polish UI, tryb senior, dark mode, stretch #1–2, bugfixy | **M4:** test z osobą spoza zespołu (< 2 min ankieta) |
| T+20 – T+22 | Slajdy, wideo demo, README, ujawnienie AI | **M5:** PDF ≤ 10 slajdów gotowy |
| T+22 | **Feature freeze.** Tylko bugfixy krytyczne. | — |
| T+23 | Zgłoszenie na platformie (z zapasem 1h przed deadline'em) | ✅ |

Sen: rotacja po 3–4h w oknie T+8–T+16, tak żeby na M3 i pitch wszyscy byli przytomni.

## Rytm pracy

- Stand-up 5 min co 3h: co zrobione, co blokuje, czy kontrakt wymaga zmiany.
- Jeden kanał „#integracja” na prośby o zmianę kontraktu.
- WS0 robi merge do `main` w fazie integracji; po T+16 każdy merge = przejście scenariusza demo.

## Jak delegować do agenta (szablon promptu)

```
Pracujesz w workstreamie WS<N>. Przeczytaj AGENTS.md, docs/workstreams/ws<N>-*.md
i docs/03-contracts.md. Zrób zadanie "<ID zadania z briefu>".
Zmieniaj tylko pliki w: <katalogi>. Najpierw przedstaw plan (3–5 punktów),
potem testy, potem implementacja. Na koniec uruchom `pnpm --filter <pakiet> check`
i zaraportuj wynik. Nie zmieniaj kontraktów — jeśli trzeba, opisz propozycję zmiany.
```
