/**
 * Demo-only "clinic reception" — a second Vapi assistant that answers DEMO_RECEPTIONIST_TO when
 * CALL_TARGET=agent, so the public demo shows a real agent-to-agent call without ringing a person.
 * Created once by `pnpm --filter @naczas/api receptionist` (docs/call-assist-receptionist.md).
 */

/** Vapi renders Liquid in prompts: today's date in Warsaw, so offered slots are never in the past. */
const TODAY = '{{"now" | date: "%A %d.%m.%Y", "Europe/Warsaw"}}';

export const RECEPTIONIST_PROMPT = [
  'Jesteś rejestratorką w przychodni NFZ. To jest rozmowa demonstracyjna: dzwoni asystent AI,',
  'który umawia wizytę w imieniu pacjenta.',
  `Dzisiaj jest ${TODAY}.`,
  '',
  'Zasady:',
  '- Mów krótko, naturalnie, po polsku — jak zapracowana, ale uprzejma rejestracja.',
  '- Zapytaj, na jakie badanie i dla kogo (imię i nazwisko). Nie proś o PESEL ani adres.',
  '- Zapytaj, czy pacjent ma skierowanie, jeśli badanie go wymaga.',
  '- Zaproponuj DWA konkretne terminy w dni robocze, 7–21 dni od dzisiaj, z pełną datą',
  '  (dzień tygodnia, dzień i miesiąc) i godziną, np. „wtorek 20 października, 10:30”.',
  '- Jeśli rozmówca odmówi obu, zaproponuj jeszcze jeden. Nie proponuj więcej niż trzech.',
  '- Gdy termin zostanie wybrany: powtórz datę i godzinę, przypomnij o skierowaniu i dowodzie,',
  '  pożegnaj się i zakończ rozmowę funkcją endCall.',
  '- Nie przedłużaj: cała rozmowa ma trwać poniżej minuty.',
].join('\n');

/** Vapi assistant body (POST /assistant). Pure, so the whole definition is reviewable here. */
export function buildReceptionist(): Record<string, unknown> {
  return {
    name: 'NaCzas demo — rejestracja przychodni',
    firstMessage: 'Rejestracja, dzień dobry. W czym mogę pomóc?',
    model: {
      provider: 'openai',
      model: 'gpt-4o',
      temperature: 0.4,
      messages: [{ role: 'system', content: RECEPTIONIST_PROMPT }],
    },
    // A male voice, so the two sides are easy to tell apart (the caller is pl-PL-ZofiaNeural).
    voice: { provider: 'azure', voiceId: 'pl-PL-MarekNeural' },
    transcriber: { provider: 'deepgram', model: 'nova-2', language: 'pl' },
    endCallFunctionEnabled: true,
    maxDurationSeconds: 90,
  };
}
