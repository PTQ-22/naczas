/** Upper bound for keeping the iframe around if the browser never fires `afterprint`. */
const CLEANUP_AFTER_MS = 60_000;

interface PrintEnv {
  document: Document;
  window: Window;
}

/**
 * Prints a standalone HTML document on web. expo-print's web `printAsync({ html })` ignores the
 * html and calls window.print() on the app page (M3 report P1), so the document is loaded into
 * a hidden iframe and printed from there. If the iframe can't be used, a new window is the
 * fallback. The browser's print dialog offers "Save as PDF".
 */
export function printHtml(html: string, env: PrintEnv = { document, window }): Promise<void> {
  const { document: doc } = env;
  const iframe = doc.createElement('iframe');
  if (!('srcdoc' in iframe)) return printInNewWindow(html, env);

  return new Promise((resolve, reject) => {
    iframe.setAttribute('aria-hidden', 'true');
    iframe.setAttribute('tabindex', '-1');
    // Off-screen but laid out: some browsers print an empty page from display:none frames.
    Object.assign(iframe.style, {
      position: 'fixed',
      right: '0',
      bottom: '0',
      width: '0',
      height: '0',
      border: '0',
    });

    let removed = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const remove = () => {
      if (removed) return;
      removed = true;
      clearTimeout(timer);
      iframe.remove();
    };

    iframe.onload = () => {
      const frameWindow = iframe.contentWindow;
      if (!frameWindow) {
        remove();
        printInNewWindow(html, env).then(resolve, reject);
        return;
      }
      frameWindow.addEventListener('afterprint', remove);
      timer = setTimeout(remove, CLEANUP_AFTER_MS);
      try {
        frameWindow.focus();
        frameWindow.print();
        resolve();
      } catch {
        remove();
        printInNewWindow(html, env).then(resolve, reject);
      }
    };
    iframe.srcdoc = html;
    doc.body.appendChild(iframe);
  });
}

function printInNewWindow(html: string, { window: win }: PrintEnv): Promise<void> {
  const popup = win.open('', '_blank');
  // Popup blockers return null; the screen shows its "could not prepare the PDF" message.
  if (!popup) return Promise.reject(new Error('Print window was blocked'));
  popup.document.open();
  popup.document.write(html);
  popup.document.close();
  popup.focus();
  popup.print();
  return Promise.resolve();
}
