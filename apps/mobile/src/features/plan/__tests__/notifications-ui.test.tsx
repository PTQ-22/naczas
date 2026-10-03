import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { MOCK_TODAY, mockPlan } from '@naczas/rules';

import {
  getNotificationPermission,
  requestNotificationPermission,
  useInAppReminders,
} from '@/notifications';
import { ThemeProvider } from '@/theme';

import { NotificationPrompt } from '../NotificationPrompt';
import { ReminderBanner } from '../ReminderBanner';

import type { ReactElement } from 'react';

jest.mock('@/notifications', () => ({
  getNotificationPermission: jest.fn(),
  requestNotificationPermission: jest.fn(),
  useInAppReminders: jest.fn(),
}));

const mockGet = getNotificationPermission as jest.Mock;
const mockRequest = requestNotificationPermission as jest.Mock;
const mockReminders = useInAppReminders as jest.Mock;

const renderThemed = (ui: ReactElement) =>
  render(<ThemeProvider initial={{ darkMode: 'light' }}>{ui}</ThemeProvider>);

describe('NotificationPrompt', () => {
  beforeEach(() => jest.clearAllMocks());

  it('asks in context when the OS has not been asked yet, then hides', async () => {
    mockGet.mockResolvedValue('undetermined');
    mockRequest.mockResolvedValue('granted');
    renderThemed(<NotificationPrompt />);

    const enable = await screen.findByRole('button', { name: 'Włącz przypomnienia' });
    fireEvent.press(enable);
    await waitFor(() => expect(mockRequest).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.queryByText('Włącz przypomnienia')).toBeNull());
  });

  it.each(['granted', 'denied', 'unsupported'])('stays hidden when status is %s', async (s) => {
    mockGet.mockResolvedValue(s);
    renderThemed(<NotificationPrompt />);
    await waitFor(() => expect(mockGet).toHaveBeenCalled());
    expect(screen.queryByText('Przypomnimy Ci, kiedy zacząć szukać terminu')).toBeNull();
  });

  it('"Nie teraz" hides it without asking the OS', async () => {
    mockGet.mockResolvedValue('undetermined');
    renderThemed(<NotificationPrompt />);
    fireEvent.press(await screen.findByRole('button', { name: 'Nie teraz' }));
    expect(screen.queryByText('Włącz przypomnienia')).toBeNull();
    expect(mockRequest).not.toHaveBeenCalled();
  });
});

describe('ReminderBanner', () => {
  const plan = mockPlan({ today: MOCK_TODAY });

  it('shows the most urgent reminder and dismisses it', () => {
    const dismiss = jest.fn();
    mockReminders.mockReturnValue({
      reminders: [
        { id: 'a', title: 'Mama: czas na kolonoskopię', body: 'Zacznij szukać terminu.' },
        { id: 'b', title: 'Druga', body: '…' },
      ],
      dismiss,
    });
    renderThemed(<ReminderBanner plan={plan} />);
    expect(screen.getByText('Mama: czas na kolonoskopię')).toBeOnTheScreen();
    expect(screen.queryByText('Druga')).toBeNull();
    fireEvent.press(screen.getByRole('button', { name: /Zamknij przypomnienie/ }));
    expect(dismiss).toHaveBeenCalledWith('a');
  });

  it('renders nothing without reminders', () => {
    mockReminders.mockReturnValue({ reminders: [], dismiss: jest.fn() });
    renderThemed(<ReminderBanner plan={plan} />);
    expect(screen.queryByText('Przypomnienie')).toBeNull();
  });
});
