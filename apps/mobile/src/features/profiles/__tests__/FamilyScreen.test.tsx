import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';

import { MOCK_TODAY, mockPlan, mockProfileMama } from '@naczas/rules';
import type { Profile } from '@naczas/shared';

import { useProfilesStore, useRecordsStore, useSettingsStore } from '@/store';
import { ThemeProvider } from '@/theme';

import { confirmDestructive } from '../confirm-destructive';
import FamilyScreen from '../FamilyScreen';

jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual<object>('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));
jest.mock('../confirm-destructive', () => ({ confirmDestructive: jest.fn() }));
// Only Mama has an act_now item; network and computePlan stay out of this UI test.
jest.mock('@/services', () => ({
  usePlan: (profileId: string) => {
    const { mockPlan: plan, MOCK_TODAY: today } =
      jest.requireActual<typeof import('@naczas/rules')>('@naczas/rules');
    return {
      plan:
        profileId === 'mock-mama'
          ? plan({ today, profileId })
          : { profileId, generatedAt: today, items: [] },
      waitTimes: {},
      status: 'ready',
      refresh: jest.fn(),
    };
  },
}));

const mockConfirm = confirmDestructive as jest.Mock;

const me: Profile = {
  ...mockProfileMama,
  id: 'me',
  name: 'Kasia',
  relation: 'self',
  birthYear: 1994,
};

const renderFamily = () =>
  render(
    <ThemeProvider>
      <FamilyScreen />
    </ThemeProvider>,
  );

describe('FamilyScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useSettingsStore.getState().reset();
    useSettingsStore.setState({ todayOverride: MOCK_TODAY });
    useRecordsStore.getState().reset();
    useProfilesStore.getState().reset();
    // Nothing is rendered yet, so plain store calls (no act) are enough here.
    useProfilesStore.getState().addProfile(me);
    useProfilesStore.getState().addProfile(mockProfileMama);
  });

  it('lists people with relation, age, urgent badge and the active one checked', () => {
    renderFamily();
    const kasia = screen.getByRole('radio', { name: 'Kasia, Ja, 32 l.' });
    expect(kasia).toBeChecked();
    expect(
      screen.getByRole('radio', { name: 'Mama, Rodzic, 58 l., pilne badania: 1' }),
    ).not.toBeChecked();
    expect(screen.getByText('Pilne: 1')).toBeOnTheScreen();
    expect(mockPlan({ today: MOCK_TODAY }).items).toHaveLength(5);
  });

  it('tapping a person makes them the active profile', () => {
    renderFamily();
    fireEvent.press(screen.getByRole('radio', { name: /^Mama/ }));
    expect(useProfilesStore.getState().activeProfileId).toBe('mock-mama');
  });

  it('removes a person (and their records) only after confirmation', async () => {
    useRecordsStore.getState().upsertRecord({
      profileId: 'mock-mama',
      examId: 'mammography',
      status: 'done',
      updatedAt: MOCK_TODAY,
    });
    mockConfirm.mockResolvedValueOnce(false);
    renderFamily();

    fireEvent.press(screen.getByRole('button', { name: 'Usuń profil Mama' }));
    await waitFor(() => expect(mockConfirm).toHaveBeenCalledTimes(1));
    expect(useProfilesStore.getState().profiles).toHaveLength(2);

    mockConfirm.mockResolvedValueOnce(true);
    fireEvent.press(screen.getByRole('button', { name: 'Usuń profil Mama' }));
    await waitFor(() => expect(useProfilesStore.getState().profiles).toHaveLength(1));
    expect(useRecordsStore.getState().records).toEqual([]);
    expect(screen.queryByText('Mama')).toBeNull();
  });

  it('"Dodaj bliską osobę" opens onboarding for someone else', () => {
    renderFamily();
    fireEvent.press(screen.getByRole('button', { name: 'Dodaj bliską osobę' }));
    expect(router.push).toHaveBeenCalledWith({
      pathname: '/onboarding/welcome',
      params: { for: 'other' },
    });
  });

  it('empty state points to the survey', () => {
    useProfilesStore.getState().reset();
    renderFamily();
    fireEvent.press(screen.getByRole('button', { name: 'Zacznij ankietę' }));
    expect(router.push).toHaveBeenCalled();
  });
});
