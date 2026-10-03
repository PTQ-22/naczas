/**
 * Native stub — on iOS/Android the HTML goes through expo-print's printToFileAsync instead
 * (see share-visit-prep.ts). The real implementation is print-html.web.ts.
 */
export function printHtml(_html: string): Promise<void> {
  return Promise.reject(new Error('printHtml is only available on web'));
}
