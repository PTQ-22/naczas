# „Zadzwoń za mnie” — demo agent ↔ agent

Publiczne demo nie może dzwonić do człowieka (każde kliknięcie jury = telefon do kogoś z zespołu
i koszt). Za jawną flagą `CALL_TARGET=agent` nasz agent dzwoni do **drugiego asystenta Vapi**,
który gra rejestrację przychodni. Rozmowa jest prawdziwa (dwa głosy, transkrypcja w aplikacji),
ale po obu stronach jest AI.

| `CALL_TARGET` | Dokąd dzwoni | Kiedy |
|---|---|---|
| `phone` (domyślnie) | `DEMO_CALL_TO` (+48…, telefon kogoś z zespołu) | pitch na scenie, osoba gra rejestrację |
| `agent` | `DEMO_RECEPTIONIST_TO` (numer Vapi z asystentem „Rejestracja”) | publiczny deploy, próby |

Bez kluczy Vapi — w obu przypadkach symulacja (scenariusz), jak dotąd.

## Zabezpieczenia
- `CALL_TARGET=agent` + klucze Vapi, ale bez `DEMO_RECEPTIONIST_TO` → API **nie wstaje** (błąd walidacji env), zamiast po cichu dzwonić do człowieka.
- `CALL_ASSIST_DAILY_LIMIT` (domyślnie 20) — tyle prawdziwych połączeń na dobę; kolejne kliknięcia dostają symulację, nie błąd.
- Rozmowa agent ↔ agent ma twardy limit 90 s (`maxDurationSeconds`), żeby dwa boty nie gadały w kółko.
- Numer jest wybierany tylko z env — nigdy z requestu.

## Setup (raz, ~5 min)
1. Vapi → **Phone Numbers → Create** → darmowy numer Vapi (US). To drugi numer — inny niż `VAPI_PHONE_NUMBER_ID`, z którego dzwonimy. Skopiuj jego **ID**.
2. Utwórz asystenta „Rejestracja” i podepnij go pod ten numer (definicja: `apps/api/src/call-assist/receptionist.ts`):
   ```bash
   RECEPTIONIST_PHONE_NUMBER_ID=<id-drugiego-numeru> pnpm --filter @naczas/api receptionist
   ```
   (`VAPI_API_KEY` bierze z `apps/api/.env`.)
3. W `apps/api/.env` (lub w Renderze):
   ```
   CALL_TARGET=agent
   DEMO_RECEPTIONIST_TO=+1…   # numer z kroku 1
   ```
4. Restart API → w logu: `Call assist: live (vapi-number → receptionist agent, 20/day)`.
5. Dymki na żywo wymagają `PUBLIC_URL` (adres z Rendera albo `ngrok http 8788`); bez niego transkrypcja pojawi się po rozłączeniu.

Na slajdzie/w opisie: „w publicznym demo przychodnię gra drugi agent AI”.
