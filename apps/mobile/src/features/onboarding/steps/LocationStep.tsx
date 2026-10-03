import { LocationPicker } from '../LocationPicker';

import type { StepProps } from './step-props';

export function LocationStep({ draft, update }: StepProps) {
  return (
    <LocationPicker postalCode={draft.postalCode} location={draft.location} onChange={update} />
  );
}
