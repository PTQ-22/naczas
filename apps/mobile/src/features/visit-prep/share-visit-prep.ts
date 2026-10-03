import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

import { printHtml } from './print-html';

/**
 * Native: render the HTML to a PDF file and open the share sheet (save / send).
 * Web: print the document itself (not the app page) — the browser dialog has "Save as PDF".
 */
export async function shareVisitPrepPdf(html: string): Promise<void> {
  if (Platform.OS === 'web') {
    // Not Print.printAsync: on web it ignores `html` and prints the app screen (M3 report P1).
    await printHtml(html);
    return;
  }
  const { uri } = await Print.printToFileAsync({ html });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' });
  } else {
    // Fallback (e.g. some Android emulators without a share target): system print dialog.
    await Print.printAsync({ uri });
  }
}
