import { fireEvent, render, screen } from '@testing-library/react-native';
import { Platform } from 'react-native';

import { BookDatePicker } from '../BookDatePicker';
import { BookDatePicker as WebBookDatePicker } from '../BookDatePicker.web';

import type { DateTimePickerEvent } from '@react-native-community/datetimepicker';

interface PickerProps {
  minimumDate: Date;
  maximumDate: Date;
  onChange: (event: DateTimePickerEvent, date?: Date) => void;
}
let pickerProps: PickerProps | undefined;
jest.mock('@react-native-community/datetimepicker', () => ({
  __esModule: true,
  default: (props: PickerProps) => {
    pickerProps = props;
    return null;
  },
}));

const event = (type: DateTimePickerEvent['type']) => ({ type }) as DateTimePickerEvent;
const base = { value: '2026-10-17', min: '2026-10-03', max: '2027-10-03' };

describe('BookDatePicker (native)', () => {
  const originalOS = Platform.OS;
  afterEach(() => {
    Platform.OS = originalOS;
    pickerProps = undefined;
  });

  it('iOS: inline picker with min/max, emits ISO dates, ignores dismiss', () => {
    Platform.OS = 'ios';
    const onChange = jest.fn();
    render(<BookDatePicker {...base} onChange={onChange} />);
    expect(pickerProps?.minimumDate.getDate()).toBe(3);
    expect(pickerProps?.maximumDate.getFullYear()).toBe(2027);
    pickerProps?.onChange(event('set'), new Date(2026, 9, 20));
    expect(onChange).toHaveBeenCalledWith('2026-10-20');
    pickerProps?.onChange(event('dismissed'));
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('Android: field shows the date and opens the system dialog on press', () => {
    Platform.OS = 'android';
    render(<BookDatePicker {...base} onChange={jest.fn()} />);
    expect(pickerProps).toBeUndefined();
    fireEvent.press(screen.getByRole('button', { name: /17\.10\.2026/ }));
    expect(pickerProps).toBeDefined();
  });
});

describe('BookDatePicker (web)', () => {
  it('renders input type=date with min/max and reports typed values', () => {
    const onChange = jest.fn();
    render(<WebBookDatePicker {...base} onChange={onChange} />);
    // DOM host element (web build); found by type since it has no RN testID.
    const [input] = screen.UNSAFE_root.findAll((node) => node.type === 'input');
    if (!input) throw new Error('no <input>');
    expect(input.props).toMatchObject({
      type: 'date',
      value: '2026-10-17',
      min: '2026-10-03',
      max: '2027-10-03',
      'aria-label': 'Data wizyty',
    });
    fireEvent(input, 'change', { target: { value: '2026-12-01' } });
    expect(onChange).toHaveBeenCalledWith('2026-12-01');
  });
});
