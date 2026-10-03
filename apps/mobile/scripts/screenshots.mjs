// Deck screenshots (390×844 @3x; light, dark, senior). Start the app first:
//   EXPO_PUBLIC_USE_MOCKS=1 pnpm --filter @naczas/mobile exec expo start --web --port 8082
//   node apps/mobile/scripts/screenshots.mjs pitch/screenshots /tmp/naczas-chrome
// Headless Chrome via raw CDP (Node's global WebSocket) — no puppeteer dependency.
import { Buffer } from 'node:buffer';
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';

const [, , outDir, userDir] = process.argv;
const ORIGIN = 'http://localhost:8082';
const PORT = 9333;
mkdirSync(outDir, { recursive: true });

const chrome = spawn(
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  [
    '--headless=new',
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${userDir}`,
    '--no-first-run',
    '--hide-scrollbars',
    '--window-size=390,844',
    'about:blank',
  ],
  { stdio: 'ignore' },
);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let target;
for (let i = 0; i < 50 && !target; i++) {
  try {
    const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
    target = list.find((t) => t.type === 'page');
  } catch {
    await sleep(200);
  }
}
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r, { once: true }));
let id = 0;
const pending = new Map();
ws.addEventListener('message', (e) => {
  const msg = JSON.parse(e.data);
  if (msg.id && pending.has(msg.id)) {
    pending.get(msg.id)(msg);
    pending.delete(msg.id);
  }
});
const send = (method, params = {}) =>
  new Promise((resolve, reject) => {
    const mid = ++id;
    pending.set(mid, (m) =>
      m.error ? reject(new Error(JSON.stringify(m.error))) : resolve(m.result),
    );
    ws.send(JSON.stringify({ id: mid, method, params }));
  });

await send('Emulation.setDeviceMetricsOverride', {
  width: 390,
  height: 844,
  deviceScaleFactor: 3,
  mobile: true,
});

const today = '2026-10-03';
const base = { conditions: [], smoking: { status: 'never' }, createdAt: today };
const profiles = [
  {
    ...base,
    id: 'kasia',
    name: 'Kasia',
    relation: 'self',
    birthYear: 1994,
    sex: 'female',
    location: { province: '07', lat: 52.23, lng: 21.01, label: 'Warszawa' },
    familyHistory: [],
    activity: 'medium',
  },
  {
    ...base,
    id: 'mama',
    name: 'Mama',
    relation: 'parent',
    birthYear: 1968,
    sex: 'female',
    location: { province: '07', lat: 52.23, lng: 21.01, label: 'Warszawa' },
    familyHistory: ['colorectal_cancer'],
    activity: 'low',
  },
];
const records = [
  {
    profileId: 'mama',
    examId: 'mammography',
    status: 'booked',
    bookedFor: '2026-10-15',
    updatedAt: today,
  },
  {
    profileId: 'mama',
    examId: 'health_check_adult',
    status: 'done',
    lastDone: '2026-08-01',
    updatedAt: today,
  },
  {
    profileId: 'mama',
    examId: 'cervical_screening',
    status: 'done',
    lastDone: '2025-05-01',
    updatedAt: today,
  },
  {
    profileId: 'mama',
    examId: 'dental_checkup',
    status: 'done',
    lastDone: '2026-03-01',
    updatedAt: today,
  },
];

async function prepare(mode) {
  const settings = {
    seniorMode: mode === 'senior',
    darkMode: mode === 'dark' ? 'dark' : 'light',
    todayOverride: today,
  };
  await send('Page.navigate', { url: `${ORIGIN}/dev/components` });
  await sleep(1500);
  const set = (k, state) =>
    `localStorage.setItem('naczas:${k}', ${JSON.stringify(JSON.stringify({ state, version: 1 }))});`;
  // Start each mode from a clean slate (e.g. the onboarding draft from the previous mode).
  const reset = `Object.keys(localStorage).filter((k) => k.startsWith('naczas:')).forEach((k) => localStorage.removeItem(k));`;
  await send('Runtime.evaluate', {
    expression:
      reset +
      set('profiles', { profiles, activeProfileId: 'mama' }) +
      set('records', { records }) +
      set('settings', settings),
  });
}

// Optional `click`: accessible name of a radio/button to press before the shot (map view, start survey).
const pages = {
  plan: { path: '/plan' },
  exam: { path: '/exam/colonoscopy_screening' },
  family: { path: '/family' },
  components: { path: '/dev/components' },
  'facilities-list': { path: '/exam/colonoscopy_screening/facilities' },
  'facilities-map': { path: '/exam/colonoscopy_screening/facilities', click: 'Mapa', wait: 6000 },
  'onboarding-welcome': { path: '/onboarding/welcome' },
  'onboarding-step1': { path: '/onboarding/welcome', click: 'Zaczynamy', wait: 2500 },
  'visit-prep': { path: '/visit-prep' },
};
const clickByName = (name) => `(() => {
  const el = [...document.querySelectorAll('[role=radio],[role=button]')].find((e) =>
    (e.getAttribute('aria-label') || e.textContent || '').trim().startsWith(${JSON.stringify(name)}));
  el?.click();
  return Boolean(el);
})()`;

for (const mode of ['light', 'dark', 'senior']) {
  await prepare(mode);
  for (const [name, { path, click, wait = 3500 }] of Object.entries(pages)) {
    await send('Page.navigate', { url: ORIGIN + path });
    await sleep(3500); // bundle + hydration + 300 ms entrance animations with stagger
    if (click) {
      const { result } = await send('Runtime.evaluate', {
        expression: clickByName(click),
        returnByValue: true,
      });
      if (!result.value) process.stdout.write(`warn: nothing named "${click}" on ${path}\n`);
      await sleep(wait); // map tiles
    }
    const { data } = await send('Page.captureScreenshot', { format: 'png' });
    writeFileSync(`${outDir}/${name}-${mode}.png`, Buffer.from(data, 'base64'));
    process.stdout.write(`${name}-${mode}.png\n`);
  }
}
ws.close();
chrome.kill();
