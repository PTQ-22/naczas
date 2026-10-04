import { fireEvent, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { ThemeProvider } from '@/theme';

import { PlanSection } from '../PlanSection';

const renderSection = (rows: number, limit?: number) =>
  render(
    <ThemeProvider initial={{ seniorMode: false, darkMode: 'light' }}>
      <PlanSection
        urgency="act_now"
        count={rows}
        collapsible={false}
        initiallyCollapsed={false}
        limit={limit}
      >
        {Array.from({ length: rows }, (_, i) => (
          <Text key={i}>{`row ${i}`}</Text>
        ))}
      </PlanSection>
    </ThemeProvider>,
  );

describe('PlanSection limit', () => {
  it('shows the first rows and a "Pokaż jeszcze N" row that reveals the rest', () => {
    renderSection(5, 2);
    expect(screen.getByText('row 1')).toBeOnTheScreen();
    expect(screen.queryByText('row 2')).toBeNull();

    fireEvent.press(screen.getByRole('button', { name: 'Pokaż jeszcze 3' }));
    expect(screen.getByText('row 4')).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: /Pokaż jeszcze/ })).toBeNull();
  });

  it('shows everything without a limit or when the rows fit', () => {
    renderSection(2, 2);
    expect(screen.queryByRole('button', { name: /Pokaż jeszcze/ })).toBeNull();
  });
});
