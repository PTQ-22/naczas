import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

// Raw NFZ /queues recordings (scripts/fetch-fixtures.ts). Typed loosely on purpose: this test
// guards that the recordings are complete, not the NFZ schema (that is nfz/schemas.ts, WS2-2).
interface RawPage {
  meta: { count: number; page: number };
  links: { next: string | null };
  data: Array<{ id: string; attributes: Record<string, unknown> }>;
}
interface Fixture {
  request: { benefit: string; province: string; case: number };
  pages: RawPage[];
}

const ROOT = path.resolve(import.meta.dirname, 'fixtures/queues');

const fixtures = readdirSync(ROOT).flatMap((province) =>
  readdirSync(path.join(ROOT, province)).map((file) => ({
    name: `${province}/${file}`,
    data: JSON.parse(readFileSync(path.join(ROOT, province, file), 'utf8')) as Fixture,
  })),
);

describe('NFZ queue fixtures', () => {
  it('covers 3 benefits × provinces 06 and 07', () => {
    expect(fixtures.map((f) => f.name).sort()).toEqual([
      '06/kolonoskopia.json',
      '06/poradnia-stomatologiczna.json',
      '06/swiadczenia-z-zakresu-okulistyki.json',
      '07/kolonoskopia.json',
      '07/poradnia-stomatologiczna.json',
      '07/swiadczenia-z-zakresu-okulistyki.json',
    ]);
  });

  describe.each(fixtures)('$name', ({ data }) => {
    const records = data.pages.flatMap((p) => p.data);

    it('contains every page (record count = meta.count, unique ids)', () => {
      expect(records).toHaveLength(data.pages[0]!.meta.count);
      expect(new Set(records.map((r) => r.id)).size).toBe(records.length);
    });

    it('has a continuous links.next chain ending with null', () => {
      data.pages.forEach((page, i) => {
        expect(page.meta.page).toBe(i + 1);
        expect(page.links.next === null).toBe(i === data.pages.length - 1);
      });
    });

    it('records match the request and carry fields used by normalization', () => {
      for (const { attributes: a } of records) {
        // NFZ matches `benefit` by prefix: 'PORADNIA STOMATOLOGICZNA' also returns
        // 'PORADNIA STOMATOLOGICZNA DLA DZIECI' — aggregation must filter on the exact name.
        expect(a.benefit).toMatch(new RegExp(`^${data.request.benefit}`));
        expect(a.case).toBe(data.request.case);
        expect(a).toHaveProperty('dates');
        expect(a).toHaveProperty('statistics');
        expect(a).toHaveProperty('latitude');
        expect(a).toHaveProperty('longitude');
      }
    });
  });
});
