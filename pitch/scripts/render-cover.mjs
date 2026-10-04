// Renders pitch/cover/cover.html to cover.png (1920×1080) and cover-1200x630.png.
// No npm packages: launches a local Chrome with the DevTools protocol (Node ≥ 22 global WebSocket),
// waits for Google Fonts (document.fonts.ready) and the screenshots before capturing.
// Usage: node pitch/scripts/render-cover.mjs   (override browser with CHROME_PATH=/path/to/chrome)
/* global fetch, WebSocket -- Node >= 22 built-ins (README requires Node 22). */
import { Buffer } from 'node:buffer';
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import process from 'node:process';
import { setTimeout } from 'node:timers';
import { fileURLToPath, pathToFileURL } from 'node:url';

const coverDir = join(dirname(fileURLToPath(import.meta.url)), '../cover');
const input = pathToFileURL(join(coverDir, 'cover.html')).href;

const chrome = [
  process.env.CHROME_PATH,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
].find((path) => path && existsSync(path));
if (!chrome) {
  process.stderr.write('Chrome/Chromium not found. Set CHROME_PATH.\n');
  process.exit(1);
}

const port = 9400 + Math.floor(Math.random() * 500);
const profile = mkdtempSync(join(tmpdir(), 'naczas-cover-'));
const browser = spawn(chrome, [
  '--headless=new',
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${profile}`,
  '--hide-scrollbars',
  '--no-first-run',
  'about:blank',
]);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function pageSocket() {
  for (let i = 0; i < 50; i++) {
    try {
      const targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
      const page = targets.find((t) => t.type === 'page');
      if (page) return page.webSocketDebuggerUrl;
    } catch {
      // Chrome not listening yet.
    }
    await sleep(200);
  }
  throw new Error('Chrome DevTools did not start');
}

const ws = new WebSocket(await pageSocket());
await new Promise((r) => (ws.onopen = r));
let nextId = 0;
const pending = new Map();
ws.onmessage = (e) => {
  const msg = JSON.parse(e.data);
  pending.get(msg.id)?.(msg);
  pending.delete(msg.id);
};
const send = (method, params = {}) =>
  new Promise((resolve, reject) => {
    const id = ++nextId;
    pending.set(id, (m) => (m.error ? reject(new Error(m.error.message)) : resolve(m.result)));
    ws.send(JSON.stringify({ id, method, params }));
  });

async function render(url, width, height, scale, file) {
  await send('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: scale,
    mobile: false,
  });
  await send('Page.navigate', { url });
  // Fonts + every <img> decoded, otherwise the first frame has fallback fonts / empty phones.
  const ready = `(async () => {
    for (let i = 0; i < 100 && document.readyState !== 'complete'; i++) await new Promise(r => setTimeout(r, 100));
    await document.fonts.ready;
    await Promise.all([...document.images].map(img => img.decode().catch(() => {})));
    return document.fonts.check('800 40px "Bricolage Grotesque"');
  })()`;
  await sleep(500);
  const { result } = await send('Runtime.evaluate', {
    expression: ready,
    awaitPromise: true,
    returnByValue: true,
  });
  if (!result.value) process.stderr.write('warning: Bricolage Grotesque not loaded (offline?)\n');
  const shot = await send('Page.captureScreenshot', { format: 'png' });
  writeFileSync(join(coverDir, file), Buffer.from(shot.data, 'base64'));
  process.stdout.write(`written: pitch/cover/${file}\n`);
}

try {
  await send('Page.enable');
  await render(input, 1920, 1080, 1, 'cover.png');
  // 1200×630 = 1920×1008 stage at 0.625.
  await render(`${input}?og`, 1920, 1008, 0.625, 'cover-1200x630.png');
} finally {
  ws.close();
  browser.kill();
  await sleep(300);
  rmSync(profile, { recursive: true, force: true });
}
