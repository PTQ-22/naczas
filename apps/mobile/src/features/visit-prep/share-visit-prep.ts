import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

/**
 * Native: render the HTML to a PDF file and open the share sheet (save / send).
 * Web: there is no file system — open the browser print dialog, where "Save as PDF" is built in.
 */
export async function shareVisitPrepPdf(html: string): Promise<void> {
  if (Platform.OS === 'web') {
    await Print.printAsync({ html });
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
