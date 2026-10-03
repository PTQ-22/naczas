import type { VisitPrepSummary } from '@naczas/rules';

import { buildVisitPrepHtml } from '../build-visit-prep-html';
import { printHtml } from '../print-html.web';

const summary: VisitPrepSummary = {
  person: { name: 'Mama', age: 58, sex: 'female', sexLabel: 'kobieta' },
  riskFactors: ['Rak jelita grubego w rodzinie'],
  askForReferral: [{ examId: 'eye_exam', name: 'Badanie u okulisty', reason: 'Kontrola wzroku.' }],
  noReferralNeeded: [{ examId: 'colonoscopy_screening', name: 'Kolonoskopia' }],
  recentlyDone: [],
  questions: ['Od którego z tych badań warto zacząć?'],
};

/** Minimal stand-ins for the DOM pieces printHtml touches (Jest runs without a browser). */
function fakeEnv({
  frameWindow = true,
  srcdoc = true,
  popup = true,
}: { frameWindow?: boolean; srcdoc?: boolean; popup?: boolean } = {}) {
  const listeners: Record<string, () => void> = {};
  const contentWindow = {
    focus: jest.fn(),
    print: jest.fn(),
    addEventListener: jest.fn((type: string, fn: () => void) => {
      listeners[type] = fn;
    }),
  };
  const iframe: Record<string, unknown> = {
    style: {},
    setAttribute: jest.fn(),
    remove: jest.fn(),
    onload: null,
    contentWindow: frameWindow ? contentWindow : null,
  };
  if (srcdoc) iframe.srcdoc = '';
  const popupDoc = { open: jest.fn(), write: jest.fn(), close: jest.fn() };
  const popupWindow = { document: popupDoc, focus: jest.fn(), print: jest.fn() };
  const env = {
    document: {
      createElement: jest.fn(() => iframe),
      // Real browsers load the srcdoc asynchronously; firing onload on append is enough here.
      body: { appendChild: jest.fn(() => (iframe.onload as () => void)()) },
    },
    window: { open: jest.fn(() => (popup ? popupWindow : null)) },
  };
  return {
    env: env as unknown as { document: Document; window: Window },
    iframe,
    contentWindow,
    listeners,
    popupDoc,
    popupWindow,
    open: env.window.open,
  };
}

describe('printHtml (web)', () => {
  const html = buildVisitPrepHtml(summary, '2026-10-03');

  it('prints the visit-prep document in a hidden iframe, not the app page', async () => {
    const f = fakeEnv();
    await printHtml(html, f.env);
    expect(f.iframe.srcdoc).toBe(html);
    for (const heading of [
      'Czynniki ryzyka',
      'Poproś lekarza o skierowanie na',
      'Możesz zapisać się bez skierowania',
      'Ostatnio zrobione',
      'Pytania do lekarza',
    ]) {
      expect(f.iframe.srcdoc).toContain(`<h2>${heading}</h2>`);
    }
    expect(f.contentWindow.print).toHaveBeenCalledTimes(1);
    expect(f.iframe.setAttribute).toHaveBeenCalledWith('aria-hidden', 'true');
    expect(f.open).not.toHaveBeenCalled();
  });

  it('removes the iframe after printing', async () => {
    const f = fakeEnv();
    await printHtml(html, f.env);
    expect(f.iframe.remove).not.toHaveBeenCalled();
    f.listeners.afterprint?.();
    expect(f.iframe.remove).toHaveBeenCalledTimes(1);
  });

  it('falls back to a new window when the iframe has no window', async () => {
    const f = fakeEnv({ frameWindow: false });
    await printHtml(html, f.env);
    expect(f.iframe.remove).toHaveBeenCalled();
    expect(f.popupDoc.write).toHaveBeenCalledWith(html);
    expect(f.popupWindow.print).toHaveBeenCalled();
  });

  it('falls back to a new window when srcdoc is not supported', async () => {
    const f = fakeEnv({ srcdoc: false });
    await printHtml(html, f.env);
    expect(f.popupDoc.write).toHaveBeenCalledWith(html);
  });

  it('rejects when the fallback popup is blocked (screen shows its error)', async () => {
    const f = fakeEnv({ frameWindow: false, popup: false });
    await expect(printHtml(html, f.env)).rejects.toThrow('blocked');
  });
});
