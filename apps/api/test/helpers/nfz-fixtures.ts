import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

/** Raw recording written by scripts/fetch-fixtures.ts */
export interface QueueFixture {
  request: { benefit: string; province: string; case: number };
  fetchedAt: string;
  pages: Array<{ data: unknown[]; links: { next: string | null } }>;
}

const ROOT = path.resolve(import.meta.dirname, '../fixtures/queues');

export function loadFixture(province: string, file: string): QueueFixture {
  return JSON.parse(
    readFileSync(path.join(ROOT, province, `${file}.json`), 'utf8'),
  ) as QueueFixture;
}

export function loadAllFixtures(): QueueFixture[] {
  return readdirSync(ROOT).flatMap((province) =>
    readdirSync(path.join(ROOT, province)).map((file) =>
      loadFixture(province, file.replace(/\.json$/, '')),
    ),
  );
}

export const jsonResponse = (body: unknown) =>
  new Response(JSON.stringify(body), { headers: { 'content-type': 'application/json' } });

/** What NFZ answers when throttling: an HTML page instead of JSON */
export const rateLimitedResponse = () =>
  new Response('<html><body>Request rejected</body></html>', {
    headers: { 'content-type': 'text/html' },
  });

/**
 * Fake `fetch` serving recorded pages: matches benefit + province + page query params.
 * Unknown combinations get an empty first page, like NFZ does.
 */
export function fixtureFetch(fixtures: QueueFixture[]) {
  const calls: string[] = [];
  const fetchFn = (input: string | URL | Request): Promise<Response> => {
    const url = new URL(input instanceof Request ? input.url : input.toString());
    calls.push(url.toString());
    const fixture = fixtures.find(
      (f) =>
        f.request.benefit === url.searchParams.get('benefit') &&
        f.request.province === url.searchParams.get('province'),
    );
    const page = Number(url.searchParams.get('page') ?? '1');
    const body = fixture?.pages[page - 1] ?? {
      meta: { count: 0, page: 1 },
      links: { next: null },
      data: [],
    };
    return Promise.resolve(jsonResponse(body));
  };
  return { fetch: fetchFn, calls };
}
