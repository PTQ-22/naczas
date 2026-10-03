import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

import { printHtml } from '../print-html';
import { shareVisitPrepPdf } from '../share-visit-prep';

jest.mock('expo-print', () => ({
  printToFileAsync: jest.fn(() => Promise.resolve({ uri: 'file:///tmp/visit.pdf' })),
  printAsync: jest.fn(() => Promise.resolve()),
}));
jest.mock('../print-html', () => ({ printHtml: jest.fn(() => Promise.resolve()) }));
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

  it('web: prints the document itself, never expo-print (it prints the app page on web)', async () => {
    Platform.OS = 'web';
    await shareVisitPrepPdf('<p>x</p>');
    expect(printHtml).toHaveBeenCalledWith('<p>x</p>');
    expect(Print.printAsync).not.toHaveBeenCalled();
    expect(Print.printToFileAsync).not.toHaveBeenCalled();
    expect(Sharing.shareAsync).not.toHaveBeenCalled();
  });

  it('native: PDF file + share sheet, no web printing', async () => {
    Platform.OS = 'ios';
    await shareVisitPrepPdf('<p>x</p>');
    expect(Print.printToFileAsync).toHaveBeenCalledWith({ html: '<p>x</p>' });
    expect(Sharing.shareAsync).toHaveBeenCalled();
    expect(printHtml).not.toHaveBeenCalled();
  });

  it('native without a share target: falls back to the print dialog for the PDF', async () => {
    Platform.OS = 'android';
    (Sharing.isAvailableAsync as jest.Mock).mockResolvedValueOnce(false);
    await shareVisitPrepPdf('<p>x</p>');
    expect(Print.printAsync).toHaveBeenCalledWith({ uri: 'file:///tmp/visit.pdf' });
    expect(Sharing.shareAsync).not.toHaveBeenCalled();
  });
});
