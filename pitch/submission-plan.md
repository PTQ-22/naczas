# Submission plan — HackYeah 2026, Open Task SPORT & HEALTHCARE

> Status audit: 2026-10-04, 06:40. Deadline **4.10, 11:00** (team target: submit by **10:15**, hard stop 10:30). Submission language: **Polish**.
> ~4 h left → steps 1–3 run **in parallel**; the video and the script/rehearsal move **after** submission (the live pitch is a later phase).
> Platform: Challenge Rocket. Phase 1 = mentors score the submission (need ≥ 50%), phase 2 = live pitch.

## 1. What the task asks for

**Required:** project title · team name · team members · project description · **PDF, max 10 slides**.
**Optional:** screenshots · repo · demo links · graphics · other materials (form also has: cover image, YouTube video, website, "what's done so far", "skills comment", "how to open").
**Rules:** disclose significant AI use **and external models / APIs / datasets / libraries**; separate pre-hackathon work from hackathon work; team must be able to explain every technical decision.

**Scoring and where we stand:**

| Criterion | Weight | Our strongest evidence | Gap |
|---|---|---|---|
| Idea & Innovation | 30% | "when to start looking" = plan × real NFZ queues; **AI agent that calls the clinic** | the AI call agent is **not in the deck at all** |
| Relation to category | 20% | brief literally lists "preparation for appointments", "share with caregivers" → visit prep + family profiles | the activity/sport side is weak (activity card only) |
| Practical applicability | 20% | real NFZ data, works on web/iOS/Android, senior mode | no public demo link yet |
| Design | 20% | v2 redesign, senior + dark, WCAG AA | screenshots are outdated (show the removed "Zakład" tab, no agent screen) |
| Completeness | 10% | 1013 tests green, snapshot fallback, deploy config ready | test numbers on slide 8 are outdated; repo is private |

## 2. Where the project is now

**Done (on `main`):**
- App: onboarding, plan with lead time, exam card, NFZ facilities list + map, family profiles, visit prep + PDF, senior/dark mode, notifications, time-travel for the demo.
- Added overnight (03.10 22:00 → 04.10 04:00), **not yet in the pitch:** "Zadzwoń za mnie" AI voice agent (Vapi + Twilio, agent-first home tab, availability calendar, call result → calendar event), optional family login + cloud sync (Neon), custom exams, doctors tab. The "Zakład o zdrowie" bet was **removed**.
- `pnpm check` **green as CI runs it**: shared 54, rules 206, API 174, mobile 579 = **1013 tests**.
  - Local note: `pnpm check` fails on this machine only because the generated `apps/mobile/.expo/types/router.d.ts` is stale (it doesn't know the `agent` tab yet). Fix: run `pnpm dev:web` once (regenerates it). It's not a code bug.
- Pitch materials: `pitch/deck/deck.html` (10 slides) + `deck.pdf` (from 03.10 22:17), `slides-outline.md` with sourced numbers, `script.md` (3 min), Q&A in `docs/07`, README with an AI disclosure section, name research in `naming.md`.
- Deploy config: `Dockerfile`, `render.yaml`, `vercel.json`, step-by-step guide in `docs/deploy.md`.

**Not done / blockers:**

| # | Problem | Why it matters |
|---|---|---|
| B1 | **Privacy claims are now false.** Deck slide 8, README and Q&A say "bez kont, dane zdrowotne nie opuszczają telefonu". Family sync stores the **full profile JSON** (incl. risk factors) in Neon, unencrypted, keyed by a family code. The call agent sends `forWhom` + exam name + facility to Vapi → OpenAI gpt-4o, ElevenLabs, Deepgram. | Misleading the jury can get us disqualified. Also, privacy is our selling point. |
| B2 | AI disclosure lists only Claude Code. Missing: **Vapi, OpenAI gpt-4o, ElevenLabs, Deepgram, Twilio, Neon, Drizzle**. | Required by the rules ("external models, APIs"). |
| B3 | No public demo: README has `{LINK DO DEMO}`, no Vercel/Render URL anywhere, ws0 deploy boxes unticked. | Practical applicability + the mentors in phase 1 can't open anything. |
| B4 | Repo `PTQ-22/naczas` is **private**. | The "Code repository" field is useless unless it's public or the jury gets access. |
| B5 | Placeholders: team name, member names (slide 1, README), 3 QR codes (slide 10), `{ZESPÓŁ…}` in the README AI section, `{CZAS}` in the script. | Required fields. |
| B6 | Deck is missing the strongest new feature (AI call agent) and still shows the old flow and screenshots. | Innovation (30%) is the biggest criterion. |
| B7 | No demo video (YouTube Listed). | Optional, but it's our backup if the live demo fails and the mentors can watch it in phase 1. |

## 3. Decisions the team must make first (≤ 15 min, a human decides)

1. **Name:** the form already says "NaCzas" → keep it (the `naming.md` alternative "Zawczasu" isn't worth switching for now).
2. **Cloud sync — pitch it or hide it?** Recommendation: **keep it off in the demo build** (no `DATABASE_URL`), say "domyślnie wszystko lokalnie; synchronizacja rodzinna — prototyp, roadmap: szyfrowanie E2E". Then the privacy claim on the slide only needs a small change. If we pitch sync, slide 8 must be rewritten honestly.
3. **AI call agent — live or simulated on stage?** Without Vapi keys it runs a scripted simulation. Recommendation: real call on the video (to our own `DEMO_CALL_TO` number), simulation/backup on stage. On the slide say clearly: "demo: dzwoni na nasz numer testowy".
4. **Repo public?** Check the secrets first (B4).
5. **Who** does what (table in §5).

## 4. How to get there — steps in order

### Step 1 — Freeze the demo build (07:00–08:30, person A)
- [ ] Feature freeze: from now on only bug fixes on `main`.
- [ ] Walk through the demo scenario (`docs/01-user-journey.md` §Demo, updated with the agent: plan → "Umów za mnie" → call → calendar) on web + one phone. Fix only blockers.
- [ ] Deploy following `docs/deploy.md`: API on Render → web on Vercel → `CORS_ORIGINS`. Check `/v1/health` and the web app on a phone. **Note:** Render free sleeps after inactivity — open it ~5 min before the pitch.
- [ ] Tag `demo-v1`.

### Step 2 — Fix the content to match reality (07:00–08:00, person B)
- [ ] Slide 8 + README + Q&A in `docs/07`: privacy statement per decision 3.2. Proposed wording: *„Dane zdrowotne domyślnie tylko na telefonie. Do API: nazwa świadczenia + lokalizacja ≈ 1 km. Agent AI dostaje tylko: dla kogo, jakie badanie, która placówka.”*
- [ ] AI and resources disclosure (slide 10 + README): Claude Code (dev), **Vapi + OpenAI gpt-4o + ElevenLabs + Deepgram** (voice agent at runtime), Twilio, Neon/Drizzle (if kept), NFZ API, OSM. Fill in `{ZESPÓŁ…}`.
- [ ] Test numbers on slide 8: 1013 (54 / 206 / 174 / 579). Re-measure rules coverage: `pnpm --filter @naczas/rules test -- --coverage`.
- [ ] Pre-hackathon work statement: the repo starts on 03.10 16:32 (docs), no code from before the event.

### Step 3 — Update the deck (text 08:00–08:45 person B; screenshots + QR + export 08:30–09:30 once the deploy is live)
Fit the agent in without going over 10 slides. Proposal:
- **Slide 3 (solution):** 3 pillars → 4: Plan · Kiedy zacząć · Gdzie na NFZ · **Umówimy za Ciebie** (agent AI dzwoni do rejestracji).
- **Slide 4 (how it works):** new flow with fresh screenshots: ankieta → plan → placówki → **agent dzwoni (transkrypcja na żywo)** → termin w kalendarzu.
- **Slide 5:** add a row "Umawia wizytę za Ciebie" ✓ only for us to the comparison table (wording: "nie znaleziono" for the others, same rule as the other rows).
- **Slide 6:** remove "Karta aktywności" unless it's in the build (check). Otherwise OK.
- **Slide 9 roadmap:** E2E-encrypted sync, IKP, agent with a real e-booking API instead of a phone call.
- Retake **all screenshots** from the deployed build (light, senior, dark, agent, call screen). Old ones still show the bet tab.
- QR codes: web demo, Expo Go, repo (e.g. `npx qrcode -o qr-web.png <url>`, or any generator).
- Export: `node pitch/scripts/export-deck.mjs` → check that it's ≤ 10 pages, fonts are embedded and the file opens on another computer.
- Cover image: slide 1 as PNG — `pdftoppm -r 72 -f 1 -l 1 -singlefile -png pitch/deck/deck.pdf pitch/deck/cover`.

### Step 4 — Video (optional before submission; only if steps 1–3 finish by 09:30 — a raw 60 s recording without voice-over, otherwise after submission for the live pitch)
- [ ] 60–90 s screen recording of the demo scenario including the real agent call, Polish voice-over or captions. YouTube → **Listed**.

### Step 5 — Script and rehearsal (after submission, before the live pitch)
- [ ] `script.md`: add the agent beat to the demo (it's the "wow" moment, put it at ~1:40), fill in `{CZAS}` or remove it, keep numbers identical to the slides.
- [ ] 2× rehearsal with a timer, run through the Q&A. New questions to prepare: *Czy agent naprawdę dzwoni do przychodni? Co z RODO przy rozmowie? Co jeśli rejestracja odmówi / AI się pomyli? Ile to kosztuje za rozmowę?*

### Step 6 — Fill in the form and submit (09:30–10:15, person C can paste the drafts from §6 from 07:00 on)
- [ ] README: links, team name, final disclosure.
- [ ] Repo public (or jury access) — first scan for secrets: `git log -p | grep -iE 'api[_-]?key|secret|DATABASE_URL=postgres'`, check that no `.env` is tracked.
- [ ] Form fields (drafts below), PDF, cover, video, links. **Published** checkbox ticked at the end.
- [ ] After sending: open the public project page and check the PDF and links work.

## 5. Owner & time plan (to fill in)

| Time | Person A (dev) | Person B (pitch) | Person C (form) |
|---|---|---|---|
| 06:45–07:00 | decisions §3 together | | |
| 07:00–08:30 | freeze, demo walkthrough, deploy Render + Vercel, `demo-v1` | step 2 (privacy, AI disclosure, test numbers), then slide text | repo secrets scan → make it public; paste form drafts from §6, README placeholders |
| 08:30–09:30 | fix only demo blockers; screenshots from the live build | screenshots into the deck, QR, export PDF, cover PNG | check form text against the final deck (same numbers) |
| 09:30–10:15 | open everything on a phone (demo link, QR) | final PDF check (≤ 10 pages, opens elsewhere) | upload PDF + cover, links, **Published**, **submit** |
| 10:15–10:30 | buffer | buffer | open the public project page, check PDF and links |
| after | video, script, 2× rehearsal | | |

Cut list if late (in this order): video → Expo Go QR → new comparison-table row → retaking senior/dark screenshots (reuse the old ones if they don't show the bet tab).

## 6. Form drafts (Polish — paste and edit)

**Problem** — the current text is good and sourced (S10). Optional addition, source S2:
> …Do tego badaniami przesiewowymi raka jelita grubego NFZ objął dotąd tylko 17% uprawnionych osób (NFZ, stan na 1.10.2026).

**Solution** — add the agent:
> NaCzas na podstawie krótkiej ankiety układa indywidualny plan badań profilaktycznych dla Ciebie i Twoich bliskich, z uzasadnieniem i źródłem każdego zalecenia. Dzięki realnym danym o kolejkach NFZ w okolicy mówi nie tylko jakie badanie i kiedy, ale też kiedy zacząć je organizować, żeby zdążyć, i gdzie zrobić je najszybciej. Na koniec agent AI może zadzwonić do rejestracji i umówić wizytę w godzinach, które Ci pasują, a termin trafia do kalendarza i planu. Dane zdrowotne domyślnie zostają na telefonie.

**What's done so far and goal of your project:**
> Wszystko powstało podczas HackYeah (pierwszy commit 3.10, wcześniej tylko koncepcja na papierze). Działa: ankieta dla siebie i bliskiej osoby, plan badań z silnika reguł opartego o oficjalne programy MZ/NFZ (każda reguła ze źródłem), algorytm „kiedy zacząć szukać” liczony z prawdziwych danych API NFZ „Terminy leczenia” (p75 czasu oczekiwania w okolicy), lista i mapa placówek NFZ, agent głosowy AI dzwoniący do rejestracji, przygotowanie do wizyty z PDF dla lekarza, profile rodzinne, tryb senior i dark mode. Aplikacja działa na iOS, Androidzie i w przeglądarce; 1013 testów automatycznych, demo działa nawet przy awarii API NFZ (snapshot danych).
> Cel: publiczne, otwarte narzędzie, które zwiększa zgłaszalność na badania profilaktyczne — rozwijane z NFZ, samorządami i organizacjami pacjentów. Następne kroki: szyfrowana synchronizacja opiekun–rodzic, integracja z IKP, realizatorzy programów przesiewowych z API NFZ „Umowy”.

**Skills comment** (the field asks what skills we'd expect from new team members):
> Szukamy osób do dalszego rozwoju: lekarz / specjalista zdrowia publicznego do weryfikacji reguł badań, osoba z doświadczeniem w integracjach z systemami e-zdrowia (IKP, P1), designer UX z doświadczeniem w projektowaniu dla seniorów, developer React Native / TypeScript.

**Website:** link to the web demo (Vercel). **Code repository:** `https://github.com/PTQ-22/naczas` (after making it public). **Video:** YouTube Listed.

**Instructions on how to open project:**
> Najprościej: otwórz {LINK DO DEMO} w przeglądarce (także na telefonie) — bez logowania. Pierwsze otwarcie może potrwać ok. 30 s (darmowy serwer API się wybudza).
> Scenariusz: „Zacznij” → ankieta dla mamy (rok 1968, kobieta, rak jelita grubego w rodzinie) → plan → „Znajdź termin” → „Umów za mnie”. W wersji publicznej agent AI symuluje rozmowę (prawdziwe połączenia tylko na nasz numer testowy).
> Na telefonie: Expo Go + kod QR z prezentacji.
> Lokalnie: Node ≥ 22, `pnpm install`, `cp .env.example apps/mobile/.env`, `pnpm dev` (API + Expo). Szczegóły w README.

**Idea stage:** New Idea ✓ · **Challenge:** OPEN TASK: SPORT & HEALTHCARE ✓
