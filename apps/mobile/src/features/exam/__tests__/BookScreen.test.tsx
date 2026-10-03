import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';

import { useProfilesStore, useRecordsStore, useSettingsStore } from '@/store';
import { makeProfile, makeRecord } from '@/store/__fixtures__/fixtures';

import BookScreen from '../BookScreen';

import type { BookDatePickerProps } from '../book-date-picker-props';

let mockParams: Record<string, string> = {};
jest.mock('expo-router', () => ({
  useLocalSearchParams: () => mockParams,
  router: { back: jest.fn() },
}));
jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual<object>('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
// Platform pickers are tested on their own; here a text field stands in for either.
jest.mock('../BookDatePicker', () => {
  const { TextInput } = jest.requireActual<typeof import('react-native')>('react-native');
  return {
    BookDatePicker: ({ value, onChange }: BookDatePickerProps) => (
      <TextInput testID="date" value={value} onChangeText={onChange} />
    ),
  };
});

const TODAY = '2026-10-03';
const profile = makeProfile();

describe('BookScreen', () => {
  beforeEach(() => {
    mockParams = { examId: 'eye_exam' };
    jest.mocked(router.back).mockClear();
    act(() => {
      useSettingsStore.setState({ todayOverride: TODAY });
      useProfilesStore.setState({ profiles: [profile], activeProfileId: profile.id });
      useRecordsStore.setState({
        records: [makeRecord({ examId: 'eye_exam', lastDone: '2025-01-15', status: 'none' })],
      });
    });
  });

  it('defaults to today + 14 days and saves a booked record, keeping lastDone', () => {
    render(<BookScreen />);
    expect(screen.getByTestId('date').props.value).toBe('2026-10-17');
    fireEvent.press(screen.getByRole('button', { name: 'Zapisz wizytę na 17.10.2026' }));
    expect(useRecordsStore.getState().records).toEqual([
      {
        profileId: profile.id,
        examId: 'eye_exam',
        lastDone: '2025-01-15',
        status: 'booked',
        bookedFor: '2026-10-17',
        updatedAt: TODAY,
      },
    ]);
    expect(router.back).toHaveBeenCalled();
  });

  it('saves through markBooked, so the booking can be undone', () => {
    render(<BookScreen />);
    fireEvent.press(screen.getByRole('button', { name: 'Zapisz wizytę na 17.10.2026' }));
    let undone = false;
    act(() => {
      undone = useRecordsStore.getState().undo(profile.id, 'eye_exam');
    });
    expect(undone).toBe(true);
    expect(useRecordsStore.getState().records[0]).toMatchObject({
      status: 'none',
      lastDone: '2025-01-15',
    });
  });

  it('saves the date the user picked', () => {
    render(<BookScreen />);
    fireEvent.changeText(screen.getByTestId('date'), '2026-11-20');
    fireEvent.press(screen.getByRole('button', { name: 'Zapisz wizytę na 20.11.2026' }));
    expect(useRecordsStore.getState().records[0]?.bookedFor).toBe('2026-11-20');
  });

  it.each([
    ['2026-10-01', 'Data wizyty nie może być w przeszłości.'],
    ['2028-01-01', 'Wybierz datę w ciągu najbliższego roku.'],
    ['2026-13-01', 'Wpisz poprawną datę.'],
  ])('invalid date %s → error and no save', (value, message) => {
    render(<BookScreen />);
    fireEvent.changeText(screen.getByTestId('date'), value);
    expect(screen.getByText(message)).toBeTruthy();
    const save = screen.getByRole('button', { name: 'Zapisz wizytę' });
    expect(save.props.accessibilityState).toMatchObject({ disabled: true });
    fireEvent.press(save);
    expect(useRecordsStore.getState().records[0]?.status).toBe('none');
    expect(router.back).not.toHaveBeenCalled();
  });

  it('shows the facility passed from the facilities screen', () => {
    mockParams = { examId: 'eye_exam', facility: 'Przychodnia WAT' };
    render(<BookScreen />);
    expect(screen.getByText('Placówka: Przychodnia WAT')).toBeTruthy();
  });

  it('changing an existing booking starts from its date', () => {
    // Braces matter: persisted setState returns a Promise, which would make act() async.
    act(() => {
      useRecordsStore.setState({
        records: [makeRecord({ examId: 'eye_exam', status: 'booked', bookedFor: '2026-12-05' })],
      });
    });
    render(<BookScreen />);
    expect(screen.getByTestId('date').props.value).toBe('2026-12-05');
  });

  it('unknown exam → not-found state', () => {
    mockParams = { examId: 'nope' };
    render(<BookScreen />);
    expect(screen.getByText('Nie znaleziono badania')).toBeTruthy();
  });

  it('no active profile → explains instead of saving', () => {
    act(() => {
      useProfilesStore.setState({ profiles: [], activeProfileId: null });
    });
    render(<BookScreen />);
    expect(screen.getByText('Najpierw dodaj profil, żeby zapisać wizytę.')).toBeTruthy();
  });
});
