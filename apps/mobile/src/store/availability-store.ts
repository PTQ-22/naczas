import { z } from 'zod';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { ISODateSchema, TimeOfDaySchema, WeekdaySchema } from '@naczas/shared';

import { validatedPersist } from './persist';

export const SlotKindSchema = z.enum(['free', 'busy']);
/** free = green "mogę", busy = red "na pewno nie mogę" */
export type SlotKind = z.infer<typeof SlotKindSchema>;

const slotBase = {
  id: z.string(),
  from: TimeOfDaySchema,
  to: TimeOfDaySchema,
  // Optional: blocks saved before "nie mogę" existed are free time.
  kind: SlotKindSchema.optional(),
};

/** One block in the week view — like a calendar event: once, or every week on that weekday. */
export const SlotSchema = z.discriminatedUnion('repeat', [
  z.object({ ...slotBase, repeat: z.literal('once'), date: ISODateSchema }),
  z.object({ ...slotBase, repeat: z.literal('weekly'), weekday: WeekdaySchema }),
]);
export type Slot = z.infer<typeof SlotSchema>;

export const slotKind = (slot: Slot): SlotKind => slot.kind ?? 'free';

const PersistedAvailabilitySchema = z.object({
  byProfile: z.record(z.string(), z.array(SlotSchema)),
});
type PersistedAvailability = z.infer<typeof PersistedAvailabilitySchema>;

interface AvailabilityState extends PersistedAvailability {
  addSlot: (profileId: string, slot: Slot) => void;
  /** Replaces the slot with the same id */
  updateSlot: (profileId: string, slot: Slot) => void;
  removeSlot: (profileId: string, slotId: string) => void;
  removeProfile: (profileId: string) => void;
  reset: () => void;
}

let counter = 0;
/** Unique within the device — slots never leave it with their ids. */
export const newSlotId = () => `s${Date.now().toString(36)}${(counter++).toString(36)}`;

const NO_SLOTS: readonly Slot[] = [];
export const selectSlots = (profileId: string | undefined) => (s: AvailabilityState) =>
  (profileId && s.byProfile[profileId]) || NO_SLOTS;

export const useAvailabilityStore = create<AvailabilityState>()(
  persist(
    (set) => {
      const update = (profileId: string, apply: (slots: Slot[]) => Slot[]) =>
        set((s) => ({
          byProfile: { ...s.byProfile, [profileId]: apply(s.byProfile[profileId] ?? []) },
        }));
      return {
        byProfile: {},
        addSlot: (profileId, slot) => update(profileId, (slots) => [...slots, slot]),
        updateSlot: (profileId, slot) =>
          update(profileId, (slots) => slots.map((s) => (s.id === slot.id ? slot : s))),
        removeSlot: (profileId, slotId) =>
          update(profileId, (slots) => slots.filter((s) => s.id !== slotId)),
        removeProfile: (profileId) =>
          set((s) => {
            const { [profileId]: _removed, ...rest } = s.byProfile;
            return { byProfile: rest };
          }),
        reset: () => set({ byProfile: {} }),
      };
    },
    validatedPersist<AvailabilityState, PersistedAvailability>({
      name: 'availability',
      version: 2,
      schema: PersistedAvailabilitySchema,
      partialize: ({ byProfile }) => ({ byProfile }),
      // v1 stored hour chips; it lived for an hour of development — start clean.
      migrations: { 1: () => ({ byProfile: {} }) },
    }),
  ),
);
