// Prints pitch/deck/deck.html to pitch/deck/deck.pdf with a locally installed Chrome/Chromium.
// No npm packages: headless Chrome's built-in --print-to-pdf honours the deck's @page size.
// Usage: node pitch/scripts/export-deck.mjs   (override browser with CHROME_PATH=/path/to/chrome)
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import process from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const deckDir = join(dirname(fileURLToPath(import.meta.url)), '../deck');
const input = join(deckDir, 'deck.html');
const output = join(deckDir, 'deck.pdf');

const candidates = [
  process.env.CHROME_PATH,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
].filter(Boolean);

const chrome = candidates.find((path) => existsSync(path));
if (!chrome) {
  process.stderr.write(
    'Chrome/Chromium not found. Set CHROME_PATH, or open deck.html in Chrome → Print → Save as PDF.\n',
  );
  process.exit(1);
}

const result = spawnSync(
  chrome,
  [
    '--headless=new',
    '--disable-gpu',
    '--no-pdf-header-footer',
    `--print-to-pdf=${output}`,
    pathToFileURL(input).href,
  ],
  { encoding: 'utf8' },
);

if (result.status !== 0 || !existsSync(output)) {
  process.stderr.write(result.stderr || `Chrome exited with status ${result.status}\n`);
  process.exit(1);
}
process.stdout.write(`PDF written: ${output}\n`);
