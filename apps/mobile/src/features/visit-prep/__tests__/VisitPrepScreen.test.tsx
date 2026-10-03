import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import VisitPrepScreen from '../VisitPrepScreen';

jest.mock('expo-print', () => ({
  printToFileAsync: jest.fn(() => Promise.resolve({ uri: 'file:///tmp/visit.pdf' })),
  printAsync: jest.fn(() => Promise.resolve()),
}));
jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn(() => Promise.resolve(true)),
  shareAsync: jest.fn(() => Promise.resolve()),
}));

describe('VisitPrepScreen (mock profile: mama)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders the person and all sections as headers', () => {
    render(<VisitPrepScreen />);
    expect(screen.getByText('wiek: 58 · kobieta')).toBeTruthy();
    for (const heading of [
      'Czynniki ryzyka',
      'Poproś lekarza o skierowanie na',
      'Możesz zapisać się bez skierowania',
      'Ostatnio zrobione',
      'Pytania do lekarza',
    ]) {
      expect(screen.getByRole('header', { name: heading })).toBeTruthy();
    }
  });

  it('shows data from visitPrepSummary', () => {
    render(<VisitPrepScreen />);
    expect(screen.getByText('• Rak jelita grubego w rodzinie')).toBeTruthy();
    expect(screen.getByText(/^• Badanie u okulisty — /)).toBeTruthy();
    expect(screen.getByText(/^• Kolonoskopia — /)).toBeTruthy();
    expect(screen.getByText('Brak zapisanych badań z datą.')).toBeTruthy();
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
