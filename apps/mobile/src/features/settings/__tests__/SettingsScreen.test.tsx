import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import { Platform } from 'react-native';

import { resetAllData, useProfilesStore, useSettingsStore } from '@/store';
import { makeProfile } from '@/store/__fixtures__/fixtures';
import { ThemeProvider } from '@/theme';

import SettingsScreen from '../SettingsScreen';

jest.mock('expo-router', () => ({ router: { replace: jest.fn() } }));
jest.mock('expo-notifications', () => ({
  getAllScheduledNotificationsAsync: jest.fn(() => Promise.resolve([])),
  cancelScheduledNotificationAsync: jest.fn(() => Promise.resolve()),
}));

const renderSettings = () =>
  render(
    <ThemeProvider initial={{ seniorMode: false, darkMode: 'light' }}>
      <SettingsScreen />
    </ThemeProvider>,
  );

// Store setup happens before render(), so no act() — persist's async write would turn it into
// an un-awaited async act and break the next render.
beforeEach(() => {
  resetAllData();
  jest.clearAllMocks();
});

describe('SettingsScreen', () => {
  it('toggles senior mode and picks the colour theme', () => {
    renderSettings();
    const senior = screen.getByRole('switch', { name: 'Tryb senior (większy tekst)' });
    expect(senior).not.toBeChecked();

    fireEvent.press(senior);
    expect(useSettingsStore.getState().seniorMode).toBe(true);
    expect(screen.getByRole('switch', { name: 'Tryb senior (większy tekst)' })).toBeChecked();

    fireEvent.press(screen.getByRole('radio', { name: 'Ciemny' }));
    expect(useSettingsStore.getState().darkMode).toBe('dark');
  });

  it('time-travels with the demo presets and resets to the real date', () => {
    useSettingsStore.getState().setTodayOverride('2026-10-04');
    renderSettings();
    expect(screen.getByText('Data w aplikacji: 4 października 2026')).toBeOnTheScreen();

    fireEvent.press(
      screen.getByRole('button', { name: 'Przesuń datę demo o 3 miesiące do przodu' }),
    );
    expect(useSettingsStore.getState().todayOverride).toBe('2027-01-04');
    expect(screen.getByText('Data w aplikacji: 4 stycznia 2027')).toBeOnTheScreen();

    fireEvent.press(
      screen.getByRole('button', { name: 'Wyłącz datę demo i wróć do prawdziwej daty' }),
    );
    expect(useSettingsStore.getState().todayOverride).toBeNull();
  });

  it('deletes all data only after confirmation', async () => {
    useProfilesStore.getState().addProfile(makeProfile());
    renderSettings();

    fireEvent.press(screen.getByRole('button', { name: 'Usuń wszystkie dane' }));
    fireEvent.press(screen.getByRole('button', { name: 'Anuluj' }));
    expect(useProfilesStore.getState().profiles).toHaveLength(1);

    fireEvent.press(screen.getByRole('button', { name: 'Usuń wszystkie dane' }));
    fireEvent.press(
      screen.getByRole('button', { name: 'Potwierdź: usuń wszystkie dane z tego urządzenia' }),
    );
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/'));
    expect(useProfilesStore.getState().profiles).toHaveLength(0);
  });

  it('on web the test notification is shown in-app', async () => {
    const os = Platform.OS;
    Platform.OS = 'web';
    try {
      renderSettings();
      fireEvent.press(screen.getByRole('button', { name: 'Wyślij testowe powiadomienie teraz' }));
      expect(
        await screen.findByText(
          'W przeglądarce przypomnienia pokazujemy w aplikacji: „Test przypomnień NaCzas”.',
        ),
      ).toBeOnTheScreen();
    } finally {
      Platform.OS = os;
    }
  });

  it('explains that data stays on the device', () => {
    renderSettings();
    expect(screen.getByRole('header', { name: 'Prywatność' })).toBeOnTheScreen();
    expect(screen.getByText(/zapisane tylko na tym urządzeniu/)).toBeOnTheScreen();
  });
});
