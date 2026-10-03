import { fireEvent, render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';

import { ThemeProvider } from '@/theme';

import { mockPlanData } from '../__fixtures__/mock-plan-data';
import PlanScreen from '../PlanScreen';
import { usePlanData } from '../use-plan-data';

jest.mock('../use-plan-data', () => ({ usePlanData: jest.fn() }));
jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));
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

  it('senior mode also collapses "Później"', () => {
    renderPlan(true);
    expect(screen.getByRole('button', { name: 'Później (1)' })).toBeCollapsed();
  });
});
