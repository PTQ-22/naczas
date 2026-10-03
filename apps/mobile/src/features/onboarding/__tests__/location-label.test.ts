import { postalCodeToLocation } from '@/services/postal';

import { postalLocationLabel } from '../location-label';

describe('postalLocationLabel', () => {
  it('shows the city when the postal prefix names one', () => {
    const point = postalCodeToLocation('00-950');
    expect(point && postalLocationLabel(point)).toBe('Warszawa, woj. mazowieckie');
  });

  it('falls back to the province otherwise', () => {
    const point = postalCodeToLocation('05-400');
    expect(point && postalLocationLabel(point)).toBe('woj. mazowieckie');
  });
});
