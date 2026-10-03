import { View } from 'react-native';

import { useTheme } from '@/theme';

import { SelectableChip } from './SelectableChip';

interface BaseProps<T extends string> {
  /** Read by screen readers before each option, e.g. the exam name or the question. */
  groupLabel: string;
  options: readonly { value: T; label: string }[];
  testID?: string;
}

interface SingleProps<T extends string> extends BaseProps<T> {
  mode?: 'single';
  selected: T | undefined;
  onSelect: (value: T) => void;
}

interface MultiProps<T extends string> extends BaseProps<T> {
  mode: 'multi';
  selected: readonly T[];
  onChange: (values: T[]) => void;
}

export type ChipGroupProps<T extends string> = SingleProps<T> | MultiProps<T>;

/** Wrapping row of selectable chips: single (radio) by default, or multi (checkbox). */
export function ChipGroup<T extends string>(props: ChipGroupProps<T>) {
  const { space } = useTheme();
  const multi = props.mode === 'multi';

  const isSelected = (value: T) =>
    props.mode === 'multi' ? props.selected.includes(value) : props.selected === value;

  const press = (value: T) => {
    if (props.mode === 'multi') {
      props.onChange(
        props.selected.includes(value)
          ? props.selected.filter((v) => v !== value)
          : [...props.selected, value],
      );
    } else {
      props.onSelect(value);
    }
  };

  return (
    <View
      testID={props.testID}
      // RN has no "group" role; radiogroup is only correct for single choice.
      accessibilityRole={multi ? undefined : 'radiogroup'}
      accessibilityLabel={props.groupLabel}
      style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}
    >
      {props.options.map((option) => (
        <SelectableChip
          key={option.value}
          label={option.label}
          role={multi ? 'checkbox' : 'radio'}
          selected={isSelected(option.value)}
          accessibilityLabel={`${props.groupLabel}: ${option.label}`}
          onPress={() => press(option.value)}
        />
      ))}
    </View>
  );
}
