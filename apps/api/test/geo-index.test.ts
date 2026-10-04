import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { GEO_INDEX_FILE, loadGeoIndex, placeKey, withCoordinates } from '../src/nfz/geo-index';
import { NfzQueueSchema } from '../src/nfz/schemas';

const queue = (attrs: Record<string, unknown>) =>
  NfzQueueSchema.parse({ id: 'q', attributes: { benefit: 'X', ...attrs } });

describe('geo index', () => {
  const index = { 'JÓZEFÓW|ARMII KRAJOWEJ 5': [52.148315, 21.2191719] as [number, number] };

  it('keys a place by normalized locality + address', () => {
    expect(placeKey(queue({ locality: ' Józefów ', address: 'ARMII  KRAJOWEJ 5' }))).toBe(
      'JÓZEFÓW|ARMII KRAJOWEJ 5',
    );
    expect(placeKey(queue({ locality: 'GDAŃSK', address: 'UL. WODNIKA 57' }))).toBe(
      'GDAŃSK|WODNIKA 57', // v1.3 spells the street type, v1.4 doesn't
    );
    expect(placeKey(queue({ locality: 'JÓZEFÓW', address: null }))).toBeNull();
  });

  it('fills missing coordinates from the index', () => {
    const [q] = withCoordinates(
      [queue({ locality: 'JÓZEFÓW', address: 'ARMII KRAJOWEJ 5', latitude: null })],
      index,
    );
    expect(q?.attributes).toMatchObject({ latitude: 52.148315, longitude: 21.2191719 });
  });

  it("keeps NFZ's own coordinates and leaves unknown places without them", () => {
    const own = queue({
      locality: 'JÓZEFÓW',
      address: 'ARMII KRAJOWEJ 5',
      latitude: 1,
      longitude: 2,
    });
    const unknown = queue({ locality: 'RADOM', address: 'X 1', latitude: null });
    const [a, b] = withCoordinates([own, unknown], index);
    expect(a?.attributes).toMatchObject({ latitude: 1, longitude: 2 });
    expect(b?.attributes.latitude).toBeNull();
  });

  it('re-keys an index written with older normalization', () => {
    const file = path.join(mkdtempSync(path.join(tmpdir(), 'geo-')), 'places.json');
    writeFileSync(file, JSON.stringify({ 'GDAŃSK|UL. WODNIKA 57': [54.42, 18.48] }));
    expect(loadGeoIndex(file)).toEqual({ 'GDAŃSK|WODNIKA 57': [54.42, 18.48] });
  });

  it('loads the committed index and treats a missing file as empty', () => {
    expect(Object.keys(loadGeoIndex(GEO_INDEX_FILE)).length).toBeGreaterThan(1000);
    expect(loadGeoIndex('/nonexistent/places.json')).toEqual({});
  });
});
