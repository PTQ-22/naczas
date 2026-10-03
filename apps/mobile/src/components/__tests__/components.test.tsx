import { fireEvent, render, screen } from '@testing-library/react-native';

import { ThemeProvider } from '@/theme';

import { Button } from '../Button';
import { OptionTile } from '../OptionTile';
import { ProgressBar } from '../ProgressBar';

import type { ReactElement } from 'react';

const renderThemed = (ui: ReactElement, seniorMode = false) =>
  render(<ThemeProvider initial={{ seniorMode, darkMode: 'light' }}>{ui}</ThemeProvider>);

describe('Button', () => {
  it('exposes role + label and fires onPress', () => {
    const onPress = jest.fn();
    renderThemed(<Button label="Dalej" onPress={onPress} />);
    fireEvent.press(screen.getByRole('button', { name: 'Dalej' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not fire while loading and announces busy state', () => {
    const onPress = jest.fn();
    renderThemed(<Button label="Dalej" loading onPress={onPress} />);
    const button = screen.getByRole('button');
    fireEvent.press(button);
    expect(onPress).not.toHaveBeenCalled();
    expect(button).toBeBusy();
    expect(button).toBeDisabled();
  });

  it('meets min touch target (senior: 56)', () => {
    renderThemed(<Button label="OK" onPress={jest.fn()} />, true);
    expect(screen.getByRole('button')).toHaveStyle({ minHeight: 56, minWidth: 56 });
  });
});

describe('OptionTile', () => {
  it('reports checked state with the right role', () => {
    const onPress = jest.fn();
    renderThemed(<OptionTile mode="radio" label="Kobieta" selected onPress={onPress} />);
    const tile = screen.getByRole('radio', { name: 'Kobieta' });
    expect(tile).toBeChecked();
    fireEvent.press(tile);
    expect(onPress).toHaveBeenCalled();
  });
});

describe('ProgressBar', () => {
  it('clamps value and exposes it to screen readers', () => {
    renderThemed(<ProgressBar value={1.4} accessibilityLabel="Krok 7 z 7" />);
    expect(screen.getByLabelText('Krok 7 z 7')).toHaveAccessibilityValue({ now: 100 });
  });
});
