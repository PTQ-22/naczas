import type { Coverage } from '@naczas/shared';

import { coverageView } from '../coverage-view-model';

const base: Coverage = {
  program: 'colonoscopy',
  level: 'powiat',
  areaName: 'powiat bolesławiecki',
  percent: 16.5,
  eligible: 20152,
  asOf: '2026-10-01',
  source: 'https://www.nfz.gov.pl/x.xlsx',
};

describe('coverageView', () => {
  it('formats a Polish percentage, area label and NFZ date', () => {
    expect(coverageView(base)).toEqual({
      area: 'Powiat bolesławiecki',
      percent: '16,5%',
      body: 'uprawnionych osób jest objętych programem badań kolonoskopowych NFZ.',
      asOf: 'Dane NFZ, stan na 1.10.2026',
      a11y: 'Powiat bolesławiecki: 16,5 procent uprawnionych osób jest objętych programem badań kolonoskopowych NFZ.',
    });
  });

  it('labels every level', () => {
    expect(coverageView({ ...base, level: 'gmina', areaName: 'Zielonki' }).area).toBe(
      'Gmina Zielonki',
    );
    expect(coverageView({ ...base, level: 'voivodeship', areaName: 'mazowieckie' }).area).toBe(
      'Województwo mazowieckie',
    );
    expect(
      coverageView({ ...base, level: 'country', areaName: 'Polska', percent: 33 }).percent,
    ).toBe('33%');
  });
});
