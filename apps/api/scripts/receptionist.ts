/**
 * One-off setup for CALL_TARGET=agent: creates the demo receptionist assistant in Vapi and makes
 * it answer the given Vapi phone number. Changes your Vapi account — run it deliberately:
 *
 *   VAPI_API_KEY=… RECEPTIONIST_PHONE_NUMBER_ID=… pnpm --filter @naczas/api receptionist
 *
 * RECEPTIONIST_PHONE_NUMBER_ID is the Vapi id of a SECOND number (not VAPI_PHONE_NUMBER_ID, which
 * places the calls). Put that number in DEMO_RECEPTIONIST_TO afterwards.
 */
import 'dotenv/config';

import { buildReceptionist } from '../src/call-assist/receptionist';

const apiKey = process.env.VAPI_API_KEY;
const phoneNumberId = process.env.RECEPTIONIST_PHONE_NUMBER_ID;
if (!apiKey || !phoneNumberId) {
  console.error('Set VAPI_API_KEY and RECEPTIONIST_PHONE_NUMBER_ID.');
  process.exit(1);
}
if (phoneNumberId === process.env.VAPI_PHONE_NUMBER_ID) {
  console.error('RECEPTIONIST_PHONE_NUMBER_ID must differ from VAPI_PHONE_NUMBER_ID (the caller).');
  process.exit(1);
}

async function vapi(path: string, method: string, body: unknown): Promise<Record<string, unknown>> {
  const res = await fetch(`https://api.vapi.ai${path}`, {
    method,
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = (await res.json()) as Record<string, unknown>;
  if (!res.ok) throw new Error(`Vapi ${method} ${path}: ${res.status} ${JSON.stringify(data)}`);
  return data;
}

const assistant = await vapi('/assistant', 'POST', buildReceptionist());
const number = await vapi(`/phone-number/${phoneNumberId}`, 'PATCH', {
  assistantId: assistant.id,
});
console.log(`Receptionist assistant ${String(assistant.id)} answers ${String(number.number)}.`);
console.log(
  `Now set in apps/api/.env:\n  CALL_TARGET=agent\n  DEMO_RECEPTIONIST_TO=${String(number.number)}`,
);
