import { fireEvent, render, screen } from '@testing-library/react-native';

import { ThemeProvider } from '@/theme';

import { ChipGroup } from '../ChipGroup';
import { TextField } from '../TextField';
import { TimelineScale } from '../TimelineScale';

import type { ReactElement } from 'react';

const renderThemed = (ui: ReactElement, seniorMode = false) =>
  render(<ThemeProvider initial={{ seniorMode }}>{ui}</ThemeProvider>);

const options = [
  { value: 'a', label: 'Rok temu' },
  { value: 'b', label: 'Nigdy' },
] as const;

describe('TextField', () => {
  it('is labelled, editable and reads the error to screen readers', () => {
    const onChangeText = jest.fn();
    renderThemed(
      <TextField label="Rok urodzenia" value="" onChangeText={onChangeText} error="Podaj rok" />,
    );
    const input = screen.getByLabelText('Rok urodzenia');
    fireEvent.changeText(input, '1968');
    expect(onChangeText).toHaveBeenCalledWith('1968');
    expect(input.props.accessibilityHint).toBe('Podaj rok');
    expect(screen.getByText('Podaj rok')).toBeOnTheScreen();
  });

  it('shows the hint when there is no error; senior mode keeps a 56 pt target', () => {
    renderThemed(
      <TextField label="Kod pocztowy" value="" onChangeText={jest.fn()} hint="np. 00-950" />,
      true,
    );
    expect(screen.getByText('np. 00-950')).toBeOnTheScreen();
    expect(screen.getByLabelText('Kod pocztowy')).toHaveStyle({ minHeight: 56 });
  });
});

describe('ChipGroup', () => {
  it('single (default): radio chips, selecting calls onSelect', () => {
    const onSelect = jest.fn();
    renderThemed(
      <ChipGroup groupLabel="Kolonoskopia" options={options} selected="a" onSelect={onSelect} />,
    );
    expect(screen.getByRole('radio', { name: 'Kolonoskopia: Rok temu' })).toBeChecked();
    fireEvent.press(screen.getByRole('radio', { name: 'Kolonoskopia: Nigdy' }));
    expect(onSelect).toHaveBeenCalledWith('b');
  });

  it('multi: checkbox chips toggle values in and out', () => {
    const onChange = jest.fn();
    renderThemed(
      <ChipGroup
        mode="multi"
        groupLabel="Choroby"
        options={options}
        selected={['a']}
        onChange={onChange}
      />,
    );
    fireEvent.press(screen.getByRole('checkbox', { name: 'Choroby: Nigdy' }));
    expect(onChange).toHaveBeenLastCalledWith(['a', 'b']);
    fireEvent.press(screen.getByRole('checkbox', { name: 'Choroby: Rok temu' }));
    expect(onChange).toHaveBeenLastCalledWith([]);
  });
});

describe('TimelineScale', () => {
  it('radio segments read the full label; selecting calls onSelect', () => {
    const onSelect = jest.fn();
    renderThemed(
      <TimelineScale
        groupLabel="Dentysta"
        options={[
          {
            value: 'recent',
            label: 'Do 6 mies.',
            accessibilityLabel: 'W ciągu ostatnich 6 miesięcy',
          },
          { value: 'never', label: 'Nigdy' },
        ]}
        selected="recent"
        onSelect={onSelect}
      />,
    );
    expect(
      screen.getByRole('radio', { name: 'Dentysta: W ciągu ostatnich 6 miesięcy' }),
    ).toBeChecked();
    fireEvent.press(screen.getByRole('radio', { name: 'Dentysta: Nigdy' }));
    expect(onSelect).toHaveBeenCalledWith('never');
  });

  it('stacks into a list with full labels when segments are too narrow for the text', () => {
    renderThemed(
      <TimelineScale
        testID="scale"
        groupLabel="Dentysta"
        options={[
          {
            value: 'recent',
            label: 'Do 6 mies.',
            accessibilityLabel: 'W ciągu ostatnich 6 miesięcy',
          },
          { value: 'never', label: 'Nigdy' },
        ]}
        selected={undefined}
        onSelect={jest.fn()}
      />,
    );
    expect(screen.getByText('Do 6 mies.')).toBeOnTheScreen();
    fireEvent(screen.getByTestId('scale'), 'layout', { nativeEvent: { layout: { width: 80 } } });
    expect(screen.getByText('W ciągu ostatnich 6 miesięcy')).toBeOnTheScreen();
  });
});
