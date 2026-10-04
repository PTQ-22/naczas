import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { getExamRule } from '@naczas/rules';

import { mockPlanData } from '@/features/plan/__fixtures__/mock-plan-data';
import { usePlanData } from '@/features/plan/use-plan-data';
import { useCoverage } from '@/services/coverage';
import { useRecordsStore } from '@/store';
import { ThemeProvider } from '@/theme';

import { addToCalendar } from '../add-to-calendar';
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

jest.mock('../add-to-calendar', () => ({ addToCalendar: jest.fn() }));
jest.mock('@/services/coverage', () => ({
  useCoverage: jest.fn(() => null),
  coverageProgramFor: jest.fn(),
}));
jest.mock('expo-linking', () => ({ createURL: (path: string) => `naczas://${path}` }));

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
    (useCoverage as jest.Mock).mockReturnValue(null);
    useRecordsStore.getState().reset();
  });

  it('shows referralNote, disclaimer, queue box and the queue CTA', () => {
    renderExam('colonoscopy_screening');
    const rule = getExamRule('colonoscopy_screening');
    expect(screen.getByRole('header', { name: 'Kolonoskopia' })).toBeOnTheScreen();
    fireEvent.press(screen.getByRole('button', { name: 'Skierowanie' }));
    expect(screen.getByText(rule.referralNote ?? '')).toBeOnTheScreen();
    expect(screen.getByText(/To informacja edukacyjna/)).toBeOnTheScreen();
    expect(screen.getByText('W promieniu 25 km czeka się')).toBeOnTheScreen();
    expect(screen.getByText('3–30')).toBeOnTheScreen();
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

  it('shows where the exam is in "do umówienia → umówione → zrobione"', () => {
    renderExam('colonoscopy_screening');
    expect(screen.getByLabelText('Etap 1 z 3: Do umówienia')).toBeOnTheScreen();
    expect(screen.queryByText('Zacznij szukać: teraz')).toBeNull();
  });

  it('booked exam is on step 2 and no longer shows the queue', () => {
    renderExam('mammography');
    expect(screen.getByLabelText('Etap 2 z 3: Umówione')).toBeOnTheScreen();
    expect(screen.queryByText(/czeka się|Nie mamy aktualnych danych o kolejce/)).toBeNull();
  });

  it('keeps "why" open and the reference sections one tap away', () => {
    renderExam('colonoscopy_screening');
    expect(screen.getByText('Dlaczego')).toBeOnTheScreen();
    for (const name of ['O badaniu', 'Jak często', 'Skierowanie']) {
      expect(screen.getByRole('button', { name })).toBeCollapsed();
    }
    fireEvent.press(screen.getByRole('button', { name: 'O badaniu' }));
    expect(screen.getByRole('button', { name: 'O badaniu' })).toBeExpanded();
    expect(screen.getByText(getExamRule('colonoscopy_screening').description)).toBeOnTheScreen();
  });

  it('shows regional NFZ coverage as a quiet statistic when the API has it', () => {
    (useCoverage as jest.Mock).mockReturnValue({
      program: 'mammography',
      level: 'powiat',
      areaName: 'Poznań',
      percent: 31.2,
      eligible: 417773,
      covered: 130551,
      asOf: '2026-10-01',
      source: 'https://www.nfz.gov.pl/x.xlsx',
    });
    renderExam('mammography');
    expect(useCoverage).toHaveBeenCalledWith('mammography', expect.anything());
    expect(screen.getByText('31,2%')).toBeOnTheScreen();
    expect(screen.getByText('Poznań')).toBeOnTheScreen();
    expect(screen.getByText('Dane NFZ, stan na 1.10.2026')).toBeOnTheScreen();
  });

  it('hides the coverage card without data', () => {
    renderExam('mammography');
    expect(screen.queryByTestId('coverage-card')).toBeNull();
  });

  it('links to visit prep even when no referral is needed (M3 H2)', () => {
    renderExam('colonoscopy_screening');
    fireEvent.press(screen.getByRole('button', { name: 'Skierowanie' }));
    fireEvent.press(screen.getByRole('button', { name: 'Przygotuj się do wizyty u lekarza' }));
    expect(router.push).toHaveBeenCalledWith('/visit-prep');
  });

  it('does not let the user edit a sourced interval, only undo an old override', () => {
    renderExam('colonoscopy_screening');
    fireEvent.press(screen.getByRole('button', { name: 'Jak często' }));
    expect(screen.queryByRole('button', { name: /1m/ })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Przywróć zalecany odstęp' })).toBeNull();
  });

  it('offers to undo an interval override saved earlier', () => {
    const { mockProfileMama } = jest.requireActual<typeof import('@naczas/rules')>('@naczas/rules');
    useRecordsStore.getState().setIntervalOverride(mockProfileMama.id, 'colonoscopy_screening', 60);
    renderExam('colonoscopy_screening');
    fireEvent.press(screen.getByRole('button', { name: 'Jak często' }));
    fireEvent.press(screen.getByRole('button', { name: 'Przywróć zalecany odstęp' }));
    expect(screen.queryByRole('button', { name: 'Przywróć zalecany odstęp' })).toBeNull();
  });

  it('marks "Wartość orientacyjna" for unverified rules', () => {
    renderExam('eye_exam');
    fireEvent.press(screen.getByRole('button', { name: 'Jak często' }));
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

  it('"Dodaj do kalendarza" adds the visit for a booked exam and confirms with a toast', async () => {
    (addToCalendar as jest.Mock).mockResolvedValue('saved');
    renderExam('mammography');
    fireEvent.press(
      screen.getByRole('button', { name: /Dodaj przypomnienie o badaniu Mammografia/ }),
    );
    await waitFor(() => expect(screen.getByText('Dodano do kalendarza')).toBeOnTheScreen());
    expect(addToCalendar).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: 'visit',
        allDay: true,
        url: 'naczas://exam/mammography',
      }),
    );
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
