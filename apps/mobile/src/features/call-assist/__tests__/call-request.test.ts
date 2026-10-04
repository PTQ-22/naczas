import { rules } from '@naczas/rules';

import { DEMO_MAMA_ID } from '@/features/onboarding/demo-ids';
import { demoPersonDetails, demoPesel } from '@/features/onboarding/demo-person';
import { makeProfile } from '@/store/__fixtures__/fixtures';

import { buildCallRequest, disclosedDetails, inSentence, polishGenitive } from '../call-request';

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

  it('never turns the "Ja" profile label into a name ("w imieniu i")', () => {
    const me = makeProfile({ id: 'p-me', name: 'Ja', relation: 'self' });
    expect(
      buildCallRequest({ patient: me, profiles: [me], rule, facilityName: 'X' }).callerName,
    ).toBe('pacjenta');
    expect(
      buildCallRequest({ patient: mama, profiles: [mama, me], rule, facilityName: 'X' }).callerName,
    ).toBe('rodziny');
  });
});

describe('personal data for the agent', () => {
  const none = {
    firstName: false,
    lastName: false,
    pesel: false,
    birthDate: false,
    phone: false,
    address: false,
  };
  const mamaDemo = makeProfile({ id: DEMO_MAMA_ID, birthYear: 1968 });

  it('demo profiles have checksum-valid mock data; real profiles none', () => {
    const d = demoPersonDetails(mamaDemo)!;
    expect(d).toMatchObject({ lastName: 'Nowak', birthDate: '1968-03-15' });
    expect(d.pesel).toMatch(/^680315\d{5}$/);
    const w = [1, 3, 7, 9, 1, 3, 7, 9, 1, 3];
    const sum = d.pesel
      .split('')
      .slice(0, 10)
      .reduce((s, c, i) => s + Number(c) * w[i]!, 0);
    expect(Number(d.pesel[10])).toBe((10 - (sum % 10)) % 10);
    expect(demoPesel('2001-02-03', '0000').slice(0, 6)).toBe('012203'); // 2000s: month + 20
    expect(demoPersonDetails(makeProfile({ id: 'real-1' }))).toBeUndefined();
  });

  it('sends only the fields switched on in Settings', () => {
    const d = demoPersonDetails(mamaDemo);
    expect(disclosedDetails(d, none)).toBeUndefined();
    expect(disclosedDetails(d, { ...none, pesel: true, lastName: true })).toEqual({
      lastName: 'Nowak',
      pesel: d!.pesel,
    });
    const rule = rules.find((r) => r.id === 'colonoscopy_screening')!;
    const req = buildCallRequest({
      patient: mamaDemo,
      profiles: [mamaDemo],
      rule,
      facilityName: 'X',
      patientDetails: disclosedDetails(d, { ...none, phone: true }),
    });
    expect(req.patientDetails).toEqual({ phone: '600 100 200' });
  });
});
