import AsyncStorage from '@react-native-async-storage/async-storage';

import { deleteProfileWithData, resetAllData } from '../actions';
import { newSlotId, selectSlots, useAvailabilityStore, type Slot } from '../availability-store';

const store = () => useAvailabilityStore.getState();
const slot = (overrides: Partial<Slot> = {}): Slot =>
  ({
    id: newSlotId(),
    repeat: 'once',
    date: '2026-10-21',
    from: '10:00',
    to: '15:00',
    ...overrides,
  }) as Slot;

beforeEach(async () => {
  await AsyncStorage.clear();
  store().reset();
});

describe('availability store', () => {
  it('adds, edits and removes blocks per profile', () => {
    const s = slot();
    store().addSlot('p1', s);
    expect(selectSlots('p1')(store())).toEqual([s]);
    expect(selectSlots('p2')(store())).toEqual([]);

    const weekly: Slot = { id: s.id, repeat: 'weekly', weekday: 3, from: '10:00', to: '16:00' };
    store().updateSlot('p1', weekly);
    expect(selectSlots('p1')(store())).toEqual([weekly]);

    store().removeSlot('p1', s.id);
    expect(selectSlots('p1')(store())).toEqual([]);
  });

  it('gives every block its own id', () => {
    expect(newSlotId()).not.toBe(newSlotId());
  });

  it('is cleared with the profile and with "delete all data"', () => {
    store().addSlot('p1', slot());
    store().addSlot('p2', slot());
    deleteProfileWithData('p1');
    expect(Object.keys(store().byProfile)).toEqual(['p2']);
    resetAllData();
    expect(store().byProfile).toEqual({});
  });
});
