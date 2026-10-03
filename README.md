# NaCzas — planer profilaktyki z dostępnością NFZ

> Robocza nazwa. HackYeah 2026 · Open Task **SPORT & HEALTHCARE**.

**Jednym zdaniem:** aplikacja, która mówi nie tylko *jakie* badanie i *kiedy* powinieneś zrobić (Ty i Twój rodzic), ale też *kiedy zacząć je organizować* i *gdzie* zrobisz je na NFZ najszybciej.

## Mapa dokumentów

| Plik | Co zawiera | Kto czyta |
|---|---|---|
| [AGENTS.md](AGENTS.md) | Zasady pracy dla ludzi i agentów AI: lint, testy, commity, Definition of Done, granice odpowiedzialności | **Wszyscy, przed pierwszą linijką kodu** |
| [docs/00-overview.md](docs/00-overview.md) | Problem, persona, zakres MVP / stretch, mapowanie na kryteria jury | Wszyscy |
| [docs/01-user-journey.md](docs/01-user-journey.md) | Ekrany, flow, scenariusz demo | UI, pitch |
| [docs/02-architecture.md](docs/02-architecture.md) | Stack, struktura monorepo, przepływ danych, decyzje techniczne | Wszyscy devowie |
| [docs/03-contracts.md](docs/03-contracts.md) | Wspólne typy TS i kontrakt API — **źródło prawdy między workstreamami** | Wszyscy devowie |
| [docs/04-data-sources.md](docs/04-data-sources.md) | API NFZ (zweryfikowane), format reguł, lista badań | WS1, WS2 |
| [docs/05-scheduling-algorithm.md](docs/05-scheduling-algorithm.md) | Algorytm „kiedy zacząć szukać terminu” | WS1, WS2, WS3 |
| [docs/06-workstreams.md](docs/06-workstreams.md) | Podział pracy, zależności, harmonogram 24h | Wszyscy |
| [docs/workstreams/](docs/workstreams/) | Osobny brief na każdy workstream (zadania, kryteria akceptacji) | Właściciel WS / agent |
| [docs/07-pitch-and-submission.md](docs/07-pitch-and-submission.md) | 10 slajdów, checklista zgłoszenia, ujawnienie AI | Pitch, wszyscy na koniec |

## Status decyzji

| Decyzja | Stan |
|---|---|
| Persona: opiekun (dorosłe dziecko) + rodzic-senior | ✅ domyślnie przyjęte — do potwierdzenia przez zespół |
| Stack: Expo (RN) + web build, Hono API, monorepo pnpm | ✅ |
| Dane zdrowotne wyłącznie na urządzeniu | ✅ |
| Integracja Health Connect / HealthKit | ⏳ stretch — w MVP pytanie w ankiecie |
| Synchronizacja opiekun ↔ rodzic między urządzeniami | ⏳ stretch — w MVP opiekun zarządza profilem rodzica na swoim telefonie |
| Godzina startu (regulamin: „11:00 PM 3.10”, prawdopodobnie literówka) | ❓ potwierdzić na Discordzie — **kod dopiero po starcie** |
