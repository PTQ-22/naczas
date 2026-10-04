import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { useSettingsStore } from '@/store/settings-store';

import { LoginModal } from '../LoginModal';

const mockAuthenticate = jest.fn();
const mockSyncFamily = jest.fn();
const mockReplace = jest.fn();
jest.mock('@/services/auth', () => ({
  ...jest.requireActual<object>('@/services/auth'),
  authenticate: (...args: unknown[]) => mockAuthenticate(...args) as unknown,
}));
jest.mock('@/services/cloud-sync', () => ({
  syncFamily: (...args: unknown[]) => mockSyncFamily(...args) as unknown,
}));
jest.mock('expo-router', () => ({
  router: {
    replace: (...args: unknown[]) => mockReplace(...args) as unknown,
    canDismiss: () => false,
    dismissAll: jest.fn(),
    canGoBack: () => true,
    back: jest.fn(),
  },
}));
jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual<object>('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const { AuthError } = jest.requireActual<typeof import('@/services/auth')>('@/services/auth');

function fill() {
  fireEvent.changeText(screen.getByTestId('auth-email'), 'a@b.pl');
  fireEvent.changeText(screen.getByTestId('auth-password'), 'secret1');
  fireEvent.press(screen.getByTestId('auth-submit'));
}

describe('LoginModal', () => {
  beforeEach(() => {
    mockAuthenticate.mockReset();
    mockSyncFamily.mockReset();
    mockReplace.mockReset();
    useSettingsStore.setState({ familyCode: null });
  });

  it('logs in, waits for the family data, then opens the plan', async () => {
    mockAuthenticate.mockResolvedValue({ familyCode: 'ABC', email: 'a@b.pl' });
    let finish: (v: { profileCount: number }) => void = () => undefined;
    mockSyncFamily.mockReturnValue(new Promise((resolve) => (finish = resolve)));
    render(<LoginModal />);
    fill();
    expect(await screen.findByText('Zalogowano. Przygotowuję dane rodziny…')).toBeTruthy();
    expect(mockReplace).not.toHaveBeenCalled(); // no empty plan while data is on its way
    expect(useSettingsStore.getState().familyCode).toBe('ABC');
    finish({ profileCount: 2 });
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/(tabs)/agent'));
  });

  it('empty family: goes to the welcome screen to create the first profile', async () => {
    mockAuthenticate.mockResolvedValue({ familyCode: 'ABC', email: 'a@b.pl' });
    mockSyncFamily.mockResolvedValue({ profileCount: 0 });
    render(<LoginModal />);
    fill();
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/onboarding/welcome'));
  });

  it('wrong password: says so on screen (Alert does nothing on web) and stays logged out', async () => {
    mockAuthenticate.mockRejectedValue(new AuthError('invalid', 'x'));
    render(<LoginModal />);
    fill();
    expect(await screen.findByText('Nieprawidłowy email lub hasło.')).toBeTruthy();
    expect(useSettingsStore.getState().familyCode).toBeNull();
    expect(mockSyncFamily).not.toHaveBeenCalled();
  });

  it('sync failure: logged in, offers retry instead of silently showing an empty app', async () => {
    mockAuthenticate.mockResolvedValue({ familyCode: 'ABC', email: 'a@b.pl' });
    mockSyncFamily.mockRejectedValueOnce(new Error('HTTP 500'));
    mockSyncFamily.mockResolvedValueOnce({ profileCount: 1 });
    render(<LoginModal />);
    fill();
    fireEvent.press(await screen.findByRole('button', { name: 'Spróbuj ponownie' }));
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/(tabs)/agent'));
  });

  it('validates the form before calling the server', () => {
    render(<LoginModal />);
    fireEvent.press(screen.getByTestId('auth-submit'));
    expect(screen.getByText('Podaj email i hasło.')).toBeTruthy();
    expect(mockAuthenticate).not.toHaveBeenCalled();
  });
});
