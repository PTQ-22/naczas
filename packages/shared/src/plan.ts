import { z } from 'zod';

import { ISODateSchema } from './domain';

export const UrgencySchema = z.enum(['act_now', 'this_year', 'later', 'done', 'booked']);
export type Urgency = z.infer<typeof UrgencySchema>;

export const PlanItemSchema = z.object({
  examId: z.string(),
  profileId: z.string(),
  dueDate: ISODateSchema, // when the exam should be done
  notifyDate: ISODateSchema, // when to start arranging it (dueDate − leadTime)
  leadTimeDays: z.number(),
  leadTimeSource: z.enum(['nfz_live', 'nfz_snapshot', 'default']),
  urgency: UrgencySchema,
  reasons: z.array(z.string()), // PL: base + from modifiers
  overdue: z.boolean(),
});
export type PlanItem = z.infer<typeof PlanItemSchema>;

export const PlanSchema = z.object({
  profileId: z.string(),
  generatedAt: ISODateSchema, // = `today` passed to computePlan
  items: z.array(PlanItemSchema), // sorted: urgency, then notifyDate
});
export type Plan = z.infer<typeof PlanSchema>;
