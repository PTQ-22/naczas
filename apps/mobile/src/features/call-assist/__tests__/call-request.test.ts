import { rules } from '@naczas/rules';

import { makeProfile } from '@/store/__fixtures__/fixtures';

import { buildCallRequest, inSentence, polishGenitive } from '../call-request';

describe('polishGenitive', () => {
  it.each([
    ['Kasia', 'Kasi'],
    ['Julia', 'Julii'],
    ['Anna', 'Anny'],
    ['Ola', 'Oli'],
    ['Maja', 'Mai'],
    ['Agnieszka', 'Agnieszki'],
    ['Piotr', 'Piotra'],
    ['Marek', 'Marka'],
    ['Paweł', 'Pawła'],
    ['Kasia Nowak', 'Kasi'],
  ])('%s → %s', (name, genitive) => {
    expect(polishGenitive(name)).toBe(genitive);
  });
});

describe('inSentence', () => {
  it('lowercases the first letter only, keeping acronyms', () => {
    expect(inSentence('Kolonoskopia przesiewowa')).toBe('kolonoskopia przesiewowa');
    expect(inSentence('USG piersi')).toBe('USG piersi');
  });
});

describe('buildCallRequest', () => {
  const rule = rules.find((r) => r.id === 'colonoscopy_screening')!;
  const mama = makeProfile();
  const kasia = makeProfile({ id: 'p-kasia', name: 'Kasia', relation: 'self', birthYear: 1992 });

  it('speaks for the caregiver about the patient, without surname or birth year', () => {
    const req = buildCallRequest({
      patient: mama,
      profiles: [mama, kasia],
      rule,
      facilityName: 'Szpital Bielański',
    });
    expect(req).toEqual({
      examName: inSentence(rule.name),
      facilityName: 'Szpital Bielański',
      forWhom: 'mamę',
      callerName: 'Kasi',
    });
  });

  it('falls back to "rodziny" without a self profile and uses "ją/go" for self', () => {
    expect(
      buildCallRequest({ patient: mama, profiles: [mama], rule, facilityName: 'X' }).callerName,
    ).toBe('rodziny');
    expect(
      buildCallRequest({ patient: kasia, profiles: [kasia], rule, facilityName: 'X' }).forWhom,
    ).toBe('ją');
  });
});
