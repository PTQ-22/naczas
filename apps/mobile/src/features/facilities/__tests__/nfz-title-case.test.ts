import { distinctPlaceName, nfzTitleCase } from '../facility-format';

describe('nfzTitleCase', () => {
  it('title-cases NFZ registry names', () => {
    expect(nfzTitleCase('GABINET STOMATOLOGICZNY EWA ANDREAS JAKUBOWSKA')).toBe(
      'Gabinet Stomatologiczny Ewa Andreas Jakubowska',
    );
    expect(nfzTitleCase('POZNAŃ-NOWE MIASTO')).toBe('Poznań-Nowe Miasto');
  });

  it('keeps legal forms and lower-case connectives', () => {
    expect(nfzTitleCase('QUALITY DENT ADAMCZAK SPÓŁKA JAWNA')).toBe(
      'Quality Dent Adamczak Spółka Jawna',
    );
    expect(nfzTitleCase('CENTRUM MEDYCZNE SP. Z O.O.')).toBe('Centrum Medyczne SP. z o.o.');
    expect(nfzTitleCase('INSTYTUT IM. PROF. JANA KOWALSKIEGO')).toBe(
      'Instytut im. Prof. Jana Kowalskiego',
    );
    expect(nfzTitleCase('OS.ORŁA BIAŁEGO 100-101')).toBe('Os.Orła Białego 100-101');
  });
});

describe('distinctPlaceName', () => {
  it('hides a place name that repeats the provider', () => {
    expect(
      distinctPlaceName(
        'GABINET STOMATOLOGICZNY EWA ANDREAS JAKUBOWSKA',
        'GABINET STOMATOLOGICZNY EWA ANDREAS JAKUBOWSKA',
      ),
    ).toBeNull();
  });
  it('keeps a different place name, title-cased', () => {
    expect(
      distinctPlaceName('QUALITY DENT ADAMCZAK SPÓŁKA JAWNA', 'PORADNIA STOMATOLOGICZNA'),
    ).toBe('Poradnia Stomatologiczna');
  });
});
