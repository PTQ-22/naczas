import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

import { shareVisitPrepPdf } from '../share-visit-prep';

jest.mock('expo-print', () => ({
  printToFileAsync: jest.fn(() => Promise.resolve({ uri: 'file:///tmp/visit.pdf' })),
  printAsync: jest.fn(() => Promise.resolve()),
}));
jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn(() => Promise.resolve(true)),
  shareAsync: jest.fn(() => Promise.resolve()),
}));

describe('shareVisitPrepPdf', () => {
  const originalOS = Platform.OS;

  afterEach(() => {
    Platform.OS = originalOS;
    jest.clearAllMocks();
  });

  it('web: opens the browser print dialog, no file or share sheet', async () => {
    Platform.OS = 'web';
    await shareVisitPrepPdf('<p>x</p>');
    expect(Print.printAsync).toHaveBeenCalledWith({ html: '<p>x</p>' });
    expect(Print.printToFileAsync).not.toHaveBeenCalled();
    expect(Sharing.shareAsync).not.toHaveBeenCalled();
  });

  it('native without a share target: falls back to the print dialog for the PDF', async () => {
    Platform.OS = 'android';
    (Sharing.isAvailableAsync as jest.Mock).mockResolvedValueOnce(false);
    await shareVisitPrepPdf('<p>x</p>');
    expect(Print.printAsync).toHaveBeenCalledWith({ uri: 'file:///tmp/visit.pdf' });
    expect(Sharing.shareAsync).not.toHaveBeenCalled();
  });
});
