import { fireEvent, render, screen } from '@testing-library/react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { getExamRule } from '@naczas/rules';

import { mockPlanData } from '@/features/plan/__fixtures__/mock-plan-data';
import { usePlanData } from '@/features/plan/use-plan-data';
import { useRecordsStore } from '@/store';
import { ThemeProvider } from '@/theme';

import ExamScreen from '../ExamScreen';

// QueueNumber uses Reanimated; its official mock renders Animated.View as a plain View.
jest.mock('react-native-worklets', () =>
  jest.requireActual<object>('react-native-worklets/src/mock'),
);
jest.mock('react-native-reanimated', () =>
  jest.requireActual<object>('react-native-reanimated/mock'),
);
jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual<object>('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('@/features/plan/use-plan-data', () => ({ usePlanData: jest.fn() }));
jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn() },
  useLocalSearchParams: jest.fn(),
}));

const mockParams = useLocalSearchParams as jest.Mock;

const renderExam = (examId: unknown) => {
  mockParams.mockReturnValue({ examId });
  return render(
    <ThemeProvider initial={{ darkMode: 'light' }}>
      <ExamScreen />
    </ThemeProvider>,
  );
};

describe('ExamScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (usePlanData as jest.Mock).mockReturnValue(mockPlanData());
    useRecordsStore.getState().reset();
  });

  it('shows referralNote, disclaimer, queue box and the queue CTA', () => {
    renderExam('colonoscopy_screening');
    const rule = getExamRule('colonoscopy_screening');
    expect(screen.getByRole('header', { name: 'Kolonoskopia' })).toBeOnTheScreen();
    expect(screen.getByText(rule.referralNote ?? '')).toBeOnTheScreen();
    expect(screen.getByText(/To informacja edukacyjna/)).toBeOnTheScreen();
    expect(screen.getByText('W promieniu 25 km czeka się')).toBeOnTheScreen();
    expect(screen.getByText('30')).toBeOnTheScreen();
    expect(screen.getByText('tygodni w kolejce')).toBeOnTheScreen();

    fireEvent.press(screen.getByRole('button', { name: 'Znajdź placówkę' }));
    expect(router.push).toHaveBeenCalledWith({
      pathname: '/exam/[examId]/facilities',
      params: { examId: 'colonoscopy_screening' },
    });
  });

  it('colonoscopy: notes the queue is for clinics and links the no-referral programme (L5)', () => {
    renderExam('colonoscopy_screening');
    expect(screen.getByText(/^To kolejki NFZ do poradni/)).toBeOnTheScreen();
    const link = screen.getByRole('link', { name: /Program przesiewowy bez skierowania/ });
    // Must not sit inside an `accessible` group — screen readers would never focus it.
    // Host ancestors only, skipping the link's own wrappers (Pressable carries `accessible` too).
    let parent = link.parent;
    while (parent) {
      const isOwnWrapper = parent.props.accessibilityRole === 'link';
      if (typeof parent.type === 'string' && !isOwnWrapper) {
        expect(parent.props.accessible).not.toBe(true);
      }
      parent = parent.parent;
    }
  });

  it('links to visit prep even when no referral is needed (M3 H2)', () => {
    renderExam('colonoscopy_screening');
    fireEvent.press(screen.getByRole('button', { name: 'Przygotuj się do wizyty u lekarza' }));
    expect(router.push).toHaveBeenCalledWith('/visit-prep');
  });

  it('marks "Wartość orientacyjna" for unverified rules', () => {
    renderExam('eye_exam');
    expect(screen.getByText('Wartość orientacyjna')).toBeOnTheScreen();
  });

  it('booked exam: "Oznacz jako zrobione" → markDone + toast with working "Cofnij"', () => {
    renderExam('mammography');
    fireEvent.press(screen.getByRole('button', { name: 'Oznacz jako zrobione' }));
    expect(useRecordsStore.getState().records).toEqual([
      expect.objectContaining({ examId: 'mammography', status: 'done', lastDone: '2026-10-03' }),
    ]);
    expect(screen.getByText('Oznaczono jako zrobione')).toBeOnTheScreen();
    expect(router.back).not.toHaveBeenCalled();

    fireEvent.press(screen.getByRole('button', { name: /Cofnij oznaczenie badania Mammografia/ }));
    expect(useRecordsStore.getState().records).toEqual([]);
    expect(screen.queryByText('Oznaczono jako zrobione')).toBeNull();
  });

  it('exam outside the active person\'s plan says so instead of "no queue data" (M3 L6)', () => {
    renderExam('psa_discussion');
    expect(screen.getByText('To badanie nie jest teraz zalecane dla: Mama.')).toBeOnTheScreen();
    expect(screen.queryByText(/Nie mamy aktualnych danych o kolejce/)).toBeNull();
    expect(screen.queryByRole('button', { name: 'Oznacz jako zrobione' })).toBeNull();
  });

  it('unknown or invalid examId → not-found state', () => {
    renderExam('nope');
    expect(screen.getByText('Nie znaleziono badania')).toBeOnTheScreen();
    renderExam(['a', 'b']);
    expect(screen.getAllByText('Nie znaleziono badania').length).toBeGreaterThan(0);
  });
});
