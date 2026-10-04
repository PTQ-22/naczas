import type { TimeOfDay } from '@naczas/shared';

/** Shared by BookTimePicker.tsx (native) and BookTimePicker.web.tsx. */
export interface BookTimePickerProps {
  /** 'HH:mm', 24 h. */
  value: TimeOfDay;
  onChange: (value: TimeOfDay) => void;
}
