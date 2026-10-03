import { OptionTile } from '@/components';

interface MultiChoiceStepProps<T extends string> {
  options: readonly { value: T; label: string; description?: string }[];
  selected: readonly T[];
  onToggle: (value: T) => void;
}

/** Checkbox list; nothing ticked + "Dalej" means "none of these" (docs/design/screens.md §1). */
export function MultiChoiceStep<T extends string>({
  options,
  selected,
  onToggle,
}: MultiChoiceStepProps<T>) {
  return (
    <>
      {options.map((option) => (
        <OptionTile
          key={option.value}
          mode="checkbox"
          label={option.label}
          description={option.description}
          selected={selected.includes(option.value)}
          onPress={() => onToggle(option.value)}
        />
      ))}
    </>
  );
}
