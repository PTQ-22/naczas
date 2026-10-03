import type { ISODate } from '@naczas/shared';

/** Shared by BookDatePicker.tsx (native) and BookDatePicker.web.tsx. */
export interface BookDatePickerProps {
  /** 'YYYY-MM-DD'; on web it may be a partial/invalid string while the user types. */
  value: string;
  min: ISODate;
  max: ISODate;
  onChange: (value: string) => void;
}
