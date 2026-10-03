/**
 * Records raw NFZ /queues responses into test/fixtures/queues/ for offline tests and mobile mocks.
 * Run: pnpm --filter @naczas/api fixtures
 *
 * NFZ starts answering with non-JSON after a few rapid requests, so requests are strictly
 * sequential with a fixed gap, and a non-JSON answer triggers a longer back-off and a retry.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { benefitSlug } from '../src/nfz/slug';

const ORIGIN = 'https://api.nfz.gov.pl';
const BASE = `${ORIGIN}/app-itl-api`;
const GAP_MS = 1100;
const RETRY_BACKOFF_MS = [5_000, 15_000, 30_000];

const BENEFITS = ['KOLONOSKOPIA', 'PORADNIA STOMATOLOGICZNA', 'ŚWIADCZENIA Z ZAKRESU OKULISTYKI'];
const PROVINCES = ['06', '07'];
const CASE = 1;

const OUT_DIR = path.resolve(import.meta.dirname, '../test/fixtures/queues');

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

let lastRequestAt = 0;

async function getJson(url: string): Promise<unknown> {
  for (let attempt = 0; ; attempt++) {
    const wait = lastRequestAt + GAP_MS - Date.now();
    if (wait > 0) await sleep(wait);
    lastRequestAt = Date.now();

    const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
    const text = await res.text();
    try {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return JSON.parse(text) as unknown;
    } catch (err) {
      const backoff = RETRY_BACKOFF_MS[attempt];
      if (backoff === undefined) throw new Error(`Giving up on ${url}: ${String(err)}`);
      console.warn(`Non-JSON/failed response (${String(err)}), retrying in ${backoff} ms: ${url}`);
      await sleep(backoff);
    }
  }
}

function nextUrl(page: unknown): string | null {
  const next = (page as { links?: { next?: unknown } }).links?.next;
  if (typeof next !== 'string' || next === '') return null;
  const url = new URL(next, ORIGIN);
  // `links.next` from NFZ drops api-version; keep every page on the same API version.
  url.searchParams.set('format', 'json');
  url.searchParams.set('api-version', '1.3');
  return url.toString();
}

async function fetchAllPages(benefit: string, province: string): Promise<unknown[]> {
  const params = new URLSearchParams({
    case: String(CASE),
    province,
    benefit,
    page: '1',
    limit: '25',
    format: 'json',
    'api-version': '1.3',
  });
  const pages: unknown[] = [];
  let url: string | null = `${BASE}/queues?${params.toString()}`;
  while (url) {
    const page = await getJson(url);
    pages.push(page);
    url = nextUrl(page);
  }
  return pages;
}

async function main() {
  for (const province of PROVINCES) {
    for (const benefit of BENEFITS) {
      const pages = await fetchAllPages(benefit, province);
      const file = path.join(OUT_DIR, province, `${benefitSlug(benefit)}.json`);
      await mkdir(path.dirname(file), { recursive: true });
      const fixture = {
        request: { benefit, province, case: CASE },
        fetchedAt: new Date().toISOString(),
        pages,
      };
      await writeFile(file, `${JSON.stringify(fixture, null, 2)}\n`);
      console.log(
        `${province} ${benefit}: ${pages.length} page(s) → ${path.relative(process.cwd(), file)}`,
      );
    }
  }
}

await main();
