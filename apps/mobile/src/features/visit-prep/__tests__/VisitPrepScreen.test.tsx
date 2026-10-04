import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import { useProfilesStore, useRecordsStore, useSettingsStore } from '@/store';
import { makeProfile, makeRecord } from '@/store/__fixtures__/fixtures';

import VisitPrepScreen from '../VisitPrepScreen';

jest.mock('expo-print', () => ({
  printToFileAsync: jest.fn(() => Promise.resolve({ uri: 'file:///tmp/visit.pdf' })),
  printAsync: jest.fn(() => Promise.resolve()),
}));
jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));
jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn(() => Promise.resolve(true)),
  shareAsync: jest.fn(() => Promise.resolve()),
}));

// No location on these profiles → usePlan plans with default lead times, no network.
const mama = makeProfile({ id: 'mama', name: 'Mama', activity: 'medium' });
const kasia = makeProfile({
  id: 'kasia',
  name: 'Kasia',
  relation: 'self',
  birthYear: 1992,
  familyHistory: [],
});

const setActive = (id: string | null, profiles = [mama, kasia]) => {
  // Braces matter: persisted setState returns a Promise, which would make act() async.
  act(() => {
    useProfilesStore.setState({ profiles: id ? profiles : [], activeProfileId: id });
  });
};

describe('VisitPrepScreen (active profile from the store)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    act(() => {
      useSettingsStore.setState({ todayOverride: '2026-10-03' });
      useRecordsStore.setState({
        records: [
          makeRecord({
            profileId: 'mama',
            examId: 'mammography',
            lastDone: '2026-06-15',
            status: 'done',
          }),
        ],
      });
    });
    setActive('mama');
  });

  it('renders the person and the non-empty sections as headers', () => {
    render(<VisitPrepScreen />);
    expect(screen.getByText('wiek: 58 · kobieta')).toBeTruthy();
    for (const heading of [
      'Czynniki ryzyka',
      'Pytania do lekarza',
      'Poproś lekarza o skierowanie na',
      'Ostatnio zrobione',
    ]) {
      expect(screen.getByRole('header', { name: heading })).toBeTruthy();
    }
  });

  it('shows data from visitPrepSummary', () => {
    render(<VisitPrepScreen />);
    expect(screen.getByText('Rak jelita grubego w rodzinie')).toBeTruthy();
    // Names only on screen; the reasons are in the PDF.
    expect(screen.getByText('Badanie u okulisty')).toBeTruthy();
    // "Bez skierowania" is one comma-separated line.
    expect(screen.getByText(/^Przegląd u dentysty, Kolonoskopia, /)).toBeTruthy();
    expect(screen.queryByText(/ — /)).toBeNull();
    expect(screen.getByText('Mammografia · 15.06.2026')).toBeTruthy();
  });

  it('uses the real profile: no "low activity" for activity medium (bug B3)', () => {
    render(<VisitPrepScreen />);
    expect(screen.queryByText('Niska aktywność fizyczna')).toBeNull();
  });

  it('switching the active profile shows that person', () => {
    setActive('kasia');
    render(<VisitPrepScreen />);
    expect(screen.getByRole('header', { name: 'Kasia' })).toBeTruthy();
    // Empty sections are folded away: no risk factors goes into the person line.
    expect(screen.getByText('wiek: 34 · kobieta · bez czynników ryzyka')).toBeTruthy();
    expect(screen.queryByRole('header', { name: 'Ostatnio zrobione' })).toBeNull();
  });

  it('no profile → empty state linking to onboarding', () => {
    setActive(null);
    render(<VisitPrepScreen />);
    expect(screen.getByText('Najpierw dodaj osobę')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Dodaj osobę' }));
    expect(
      jest.requireMock<{ router: { push: jest.Mock } }>('expo-router').router.push,
    ).toHaveBeenCalledWith('/onboarding/welcome');
  });

  it('share button creates a PDF and opens the share sheet', async () => {
    render(<VisitPrepScreen />);
    fireEvent.press(screen.getByRole('button', { name: 'Pobierz PDF / Udostępnij' }));
    await waitFor(() => expect(Sharing.shareAsync).toHaveBeenCalled());
    const [[options]] = (Print.printToFileAsync as jest.Mock).mock.calls as [[{ html: string }]];
    expect(options.html).toContain('Pytania do lekarza');
    expect(Sharing.shareAsync).toHaveBeenCalledWith('file:///tmp/visit.pdf', {
      mimeType: 'application/pdf',
      UTI: 'com.adobe.pdf',
    });
  });

  it('shows an error when PDF generation fails', async () => {
    (Print.printToFileAsync as jest.Mock).mockRejectedValueOnce(new Error('boom'));
    render(<VisitPrepScreen />);
    fireEvent.press(screen.getByRole('button', { name: 'Pobierz PDF / Udostępnij' }));
    expect(
      await screen.findByText('Nie udało się przygotować PDF. Spróbuj ponownie.'),
    ).toBeTruthy();
  });
});
