import { fireEvent, render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';

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

describe('PlanScreen (mockPlan)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePlanData.mockReturnValue(mockPlanData());
  });

  it('shows the profile title, urgent summary and one primary CTA on the act_now card', () => {
    renderPlan();
    expect(screen.getByRole('header', { name: 'Plan badań — Mama' })).toBeOnTheScreen();
    expect(screen.getByText('1 badanie wymaga działania')).toBeOnTheScreen();
    expect(
      screen.getByText('W okolicy czeka się ok. 30 tyg. — zacznij szukać teraz.'),
    ).toBeOnTheScreen();
    expect(
      screen.getByRole('button', { name: /Znajdź termin na: Kolonoskopia/ }),
    ).toBeOnTheScreen();
  });

  it('queue CTA opens facilities for that exam', () => {
    renderPlan();
    fireEvent.press(screen.getByRole('button', { name: /Znajdź termin na: Kolonoskopia/ }));
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
    expect(screen.getByText('Aktywność')).toBeOnTheScreen();
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
});
