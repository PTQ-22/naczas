import { fireEvent, render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';

import { mockProfileMama } from '@naczas/rules';
import type { ExamRecord } from '@naczas/shared';

import { useRecordsStore } from '@/store';
import { ThemeProvider } from '@/theme';

import { mockPlanData } from '../__fixtures__/mock-plan-data';
import PlanScreen from '../PlanScreen';
import { usePlanData } from '../use-plan-data';

jest.mock('../use-plan-data', () => ({ usePlanData: jest.fn() }));
jest.mock('@/notifications', () => ({
  // Never resolves: permission state is covered in notifications-ui.test; here it would only
  // trigger a late state update after the assertions.
  getNotificationPermission: jest.fn(() => new Promise(() => undefined)),
  requestNotificationPermission: jest.fn(),
  useInAppReminders: jest.fn(() => ({ reminders: [], dismiss: jest.fn() })),
}));
jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));
// Non-active profiles' badges come from usePlan (UrgentCountProbe): Kasia has two act_now items.
jest.mock('@/services', () => ({
  usePlan: (profileId: string) => {
    const { mockPlan, MOCK_TODAY } =
      jest.requireActual<typeof import('@naczas/rules')>('@naczas/rules');
    const base = mockPlan({ today: MOCK_TODAY, profileId });
    const actNow = base.items.filter((i) => i.urgency === 'act_now');
    return {
      plan: { ...base, items: profileId === 'kasia' ? [...actNow, ...actNow] : base.items },
      waitTimes: {},
      status: 'ready',
      refresh: jest.fn(),
    };
  },
}));
// Reanimated's native worklets runtime isn't available under Jest; its official mock renders
// Animated.View as a plain View and ignores entering animations.
jest.mock('react-native-worklets', () =>
  jest.requireActual<object>('react-native-worklets/src/mock'),
);
jest.mock('react-native-reanimated', () =>
  jest.requireActual<object>('react-native-reanimated/mock'),
);

const mockUsePlanData = usePlanData as jest.Mock;

const renderPlan = (seniorMode = false) =>
  render(
    <ThemeProvider initial={{ seniorMode, darkMode: 'light' }}>
      <PlanScreen />
    </ThemeProvider>,
  );

// As in the demo preset: colonoscopy never done is a known act_now, not an unknown history.
const neverDone = (profileId: string): ExamRecord => ({
  profileId,
  examId: 'colonoscopy_screening',
  lastDone: 'never',
  status: 'none',
  updatedAt: '2026-10-01',
});

describe('PlanScreen (mockPlan)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePlanData.mockReturnValue(mockPlanData());
    useRecordsStore.setState({ records: [neverDone(mockProfileMama.id), neverDone('kasia')] });
  });

  it('leads with the queue number of the most urgent exam and its one CTA', () => {
    renderPlan();
    expect(screen.getByRole('header', { name: 'Plan badań — Mama' })).toBeOnTheScreen();
    // fastest 21 days ≈ 3 weeks to p75 213 days ≈ 30 weeks, printed big and read out in full.
    expect(screen.getByText('3–30')).toBeOnTheScreen();
    expect(
      screen.getByRole('button', { name: /^Kolonoskopia, Teraz, Czeka się od 3 do 30 tygodni/ }),
    ).toBeOnTheScreen();
    expect(screen.getByText(/^Zacznij szukać terminu dziś/)).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: /Znajdź placówkę: Kolonoskopia/ })).toBeOnTheScreen();
  });

  it('does not repeat the hero exam in the list below it', () => {
    renderPlan();
    expect(screen.getAllByText('Kolonoskopia')).toHaveLength(1);
  });

  it('queue CTA opens facilities for that exam', () => {
    renderPlan();
    fireEvent.press(screen.getByRole('button', { name: /Znajdź placówkę: Kolonoskopia/ }));
    expect(router.push).toHaveBeenCalledWith({
      pathname: '/exam/[examId]/facilities',
      params: { examId: 'colonoscopy_screening' },
    });
  });

  it('keeps "Zrobione" collapsed until expanded', () => {
    renderPlan();
    const doneHeader = screen.getByRole('button', { name: 'Zrobione (1)' });
    expect(doneHeader).toBeCollapsed();
    fireEvent.press(doneHeader);
    expect(screen.getByRole('button', { name: 'Zrobione (1)' })).toBeExpanded();
  });

  it('shows the activity tip for the profile with a source link', () => {
    renderPlan();
    expect(screen.getByText('Mały krok')).toBeOnTheScreen();
    expect(
      screen.getByRole('link', { name: /^Źródło: .+, otwiera przeglądarkę$/ }),
    ).toBeOnTheScreen();
  });

  it('no profile yet → onboarding prompt instead of a plan', () => {
    mockUsePlanData.mockReturnValue(mockPlanData({ activeProfile: undefined, plan: null }));
    renderPlan();
    fireEvent.press(screen.getByRole('button', { name: 'Zacznij' }));
    expect(router.push).toHaveBeenCalledWith('/onboarding/welcome');
  });

  it('switching profile calls the store action', () => {
    const data = mockPlanData();
    mockUsePlanData.mockReturnValue(data);
    renderPlan();
    fireEvent.press(screen.getByRole('tab', { name: /Mama/ }));
    expect(data.selectProfile).toHaveBeenCalledWith('mock-mama');
  });

  it('always offers the GP visit summary (M3 H2)', () => {
    renderPlan();
    fireEvent.press(
      screen.getByRole('button', { name: 'Przygotuj się do wizyty u lekarza rodzinnego' }),
    );
    expect(router.push).toHaveBeenCalledWith('/visit-prep');
  });

  it('booked card: "Oznacz jako zrobione" marks done here, with undo (M3 M6)', () => {
    useRecordsStore.getState().reset();
    renderPlan();
    fireEvent.press(screen.getByRole('button', { name: 'Oznacz jako zrobione: Mammografia' }));
    expect(useRecordsStore.getState().records).toEqual([
      expect.objectContaining({ examId: 'mammography', status: 'done' }),
    ]);
    expect(router.push).not.toHaveBeenCalled();

    fireEvent.press(screen.getByRole('button', { name: /Cofnij oznaczenie badania Mammografia/ }));
    expect(useRecordsStore.getState().records).toEqual([]);
  });

  it('shows the urgent badge on every profile, not only the active one (M3 M1)', () => {
    const base = mockPlanData();
    const kasia = { ...base.profiles[0]!, id: 'kasia', name: 'Kasia', relation: 'self' as const };
    mockUsePlanData.mockReturnValue(mockPlanData({ profiles: [...base.profiles, kasia] }));
    renderPlan();
    expect(screen.getByRole('tab', { name: 'Mama, pilne badania: 1' })).toBeOnTheScreen();
    expect(screen.getByRole('tab', { name: 'Kasia, pilne badania: 2' })).toBeOnTheScreen();
  });

  it('no button is nested inside another button (screen readers skip nested ones)', () => {
    renderPlan();
    // Host elements only: composite Pressable and its host View both carry the role.
    const buttons = screen.UNSAFE_root.findAll(
      (n) => typeof n.type === 'string' && n.props.accessibilityRole === 'button',
    );
    const nested = buttons.filter(
      (b) =>
        b.findAll(
          (n) => n !== b && typeof n.type === 'string' && n.props.accessibilityRole === 'button',
        ).length > 0,
    );
    expect(nested.map((n) => n.props.accessibilityLabel as string)).toEqual([]);
  });

  it('senior mode also collapses "Później"', () => {
    renderPlan(true);
    expect(screen.getByRole('button', { name: 'Później (1)' })).toBeCollapsed();
  });

  it('unknown history: no red ticket, a "Kiedy ostatnio?" row that saves the answer, with undo', () => {
    useRecordsStore.getState().reset();
    renderPlan();
    expect(screen.queryByText('3–30')).toBeNull();
    expect(screen.queryByText('Termin minął')).toBeNull();
    expect(screen.getByText('Kiedy ostatnio?')).toBeOnTheScreen();

    fireEvent.press(screen.getByRole('button', { name: /^Kolonoskopia: kiedy ostatnio/ }));
    fireEvent.press(screen.getByRole('radio', { name: /Kolonoskopia.*Nigdy/ }));
    expect(useRecordsStore.getState().records).toEqual([
      expect.objectContaining({ examId: 'colonoscopy_screening', lastDone: 'never' }),
    ]);
    expect(screen.getByText(/^Zapisano — Kolonoskopia/)).toBeOnTheScreen();
  });
});
