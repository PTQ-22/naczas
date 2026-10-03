import { z } from 'zod';

// Raw NFZ ITL /queues payload. Deliberately tolerant: every field we don't strictly need is
// optional/nullable and unknown fields pass through, so a new NFZ field never takes the API down.
// Only the envelope (data array, links) is required — without it the response is unusable.

const YesNoSchema = z.string().nullish(); // 'Y' | 'N' observed; kept as string on purpose

export const NfzQueueSchema = z.looseObject({
  id: z.string(),
  type: z.string().optional(),
  attributes: z.looseObject({
    case: z.number().nullish(),
    benefit: z.string(),
    provider: z.string().nullish(),
    place: z.string().nullish(),
    address: z.string().nullish(),
    locality: z.string().nullish(),
    phone: z.string().nullish(),
    latitude: z.number().nullish(),
    longitude: z.number().nullish(),
    toilet: YesNoSchema,
    ramp: YesNoSchema,
    'car-park': YesNoSchema,
    elevator: YesNoSchema,
    statistics: z
      .looseObject({
        'provider-data': z
          .looseObject({
            awaiting: z.number().nullish(),
            removed: z.number().nullish(),
            'average-period': z.number().nullish(),
            update: z.string().nullish(), // 'YYYY-MM'
          })
          .nullish(),
      })
      .nullish(),
    anesthesia: YesNoSchema, // v1.4: 'Y' | 'N' (e.g. colonoscopy under anaesthesia)
    // v1.3: always null. v1.4: { applicable, pcus: '1 mies. 3 tyg.', 'date-situation-as-at' }.
    // Lenient sub-fields: a malformed `dates` must not drop the whole record.
    dates: z
      .looseObject({
        applicable: z.boolean().nullish(),
        pcus: z.string().nullish(),
        'date-situation-as-at': z.string().nullish(), // 'YYYY-MM-DD'
      })
      .nullish()
      .catch(null),
  }),
});
export type NfzQueue = z.infer<typeof NfzQueueSchema>;

export const NfzQueuesPageSchema = z.looseObject({
  links: z.looseObject({ next: z.string().nullish() }).optional(),
  data: z.array(NfzQueueSchema),
});
export type NfzQueuesPage = z.infer<typeof NfzQueuesPageSchema>;
