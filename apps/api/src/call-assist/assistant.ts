import { callAssistOpening, type CallAssistRequest, type ISODate } from '@naczas/shared';

export interface AssistantOptions {
  /** ElevenLabs voice; without it Azure's native Polish neural voice is used */
  voiceId?: string | undefined;
  /** Public base URL of this API — Vapi then streams transcripts to our webhook */
  publicUrl?: string | undefined;
  webhookSecret?: string | undefined;
}

function systemPrompt(req: CallAssistRequest, today: ISODate): string {
  return [
    'Jesteś asystentem głosowym AI aplikacji NaCzas. Dzwonisz do rejestracji placówki medycznej,',
    `żeby umówić ${req.forWhom} na badanie: ${req.examName} (na NFZ), w placówce: ${req.facilityName}.`,
    `Dzwonisz w imieniu ${req.callerName}. Dzisiaj jest ${today}.`,
    req.bookBy
      ? `Termin powinien być najpóźniej ${req.bookBy}; jeśli proponują późniejszy, zapytaj raz o wcześniejszy, a potem przyjmij najbliższy dostępny.`
      : 'Przyjmij najbliższy dostępny termin.',
    '',
    'Zasady:',
    '- Mów krótko, uprzejmie, naturalnie, po polsku. Jedno-dwa zdania na raz.',
    '- Już się przedstawiłeś jako AI. Jeśli ktoś zapyta, potwierdź, że jesteś asystentem AI.',
    '- Nie znasz i nie podajesz PESEL, nazwiska, adresu ani numeru telefonu. Jeśli rejestracja ich potrzebuje,',
    '  powiedz, że pacjent poda je osobiście przy rejestracji lub oddzwoni. Niczego nie wymyślaj.',
    '- Skierowanie: pacjent ma e-skierowanie (jeśli badanie go wymaga).',
    '- Gdy padnie termin: powtórz datę i godzinę, żeby potwierdzić, podziękuj, pożegnaj się i zakończ rozmowę.',
    '- Gdy nie ma terminów: zapytaj, kiedy zadzwonić ponownie, podziękuj i zakończ rozmowę.',
    '- Nie udzielaj porad medycznych.',
  ].join('\n');
}

const RESULT_SCHEMA = {
  type: 'object',
  properties: {
    booked: { type: 'boolean', description: 'Czy ustalono konkretny termin wizyty' },
    date: { type: 'string', description: 'Data wizyty YYYY-MM-DD albo pusty string' },
    time: { type: 'string', description: 'Godzina wizyty HH:MM (24h) albo pusty string' },
    note: {
      type: 'string',
      description: 'Krótka uwaga dla pacjenta, np. co zabrać; może być pusta',
    },
  },
  required: ['booked', 'date', 'time', 'note'],
};

/** Inline Vapi assistant for one call. Pure — the whole agent definition is reviewable here. */
export function buildAssistant(
  req: CallAssistRequest,
  today: ISODate,
  { voiceId, publicUrl, webhookSecret }: AssistantOptions = {},
): Record<string, unknown> {
  return {
    name: 'NaCzas — zapis na badanie',
    firstMessage: callAssistOpening(req),
    model: {
      provider: 'openai',
      model: 'gpt-4o',
      temperature: 0.3,
      messages: [{ role: 'system', content: systemPrompt(req, today) }],
    },
    voice: voiceId
      ? { provider: '11labs', voiceId, model: 'eleven_multilingual_v2' }
      : { provider: 'azure', voiceId: 'pl-PL-ZofiaNeural' },
    transcriber: { provider: 'deepgram', model: 'nova-2', language: 'pl' },
    endCallFunctionEnabled: true,
    maxDurationSeconds: 180,
    analysisPlan: {
      structuredDataPrompt: [
        `Dzisiaj jest ${today}. Na podstawie rozmowy ustal, czy umówiono wizytę.`,
        'Datę zapisz jako YYYY-MM-DD; jeśli rok nie padł, wybierz najbliższą przyszłą datę.',
        'Godzinę zapisz jako HH:MM. Jeśli czegoś nie ustalono, zostaw pusty string.',
      ].join(' '),
      structuredDataSchema: RESULT_SCHEMA,
    },
    ...(publicUrl && {
      server: {
        url: `${publicUrl.replace(/\/$/, '')}/v1/call-assist/webhook`,
        ...(webhookSecret && { secret: webhookSecret }),
      },
      serverMessages: ['transcript', 'status-update'],
    }),
  };
}
