import { boundsOf, spreadOverlapping, SPREAD_DEG } from '../map-layout';

const dist = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) =>
  Math.hypot(a.lat - b.lat, a.lng - b.lng);

describe('spreadOverlapping', () => {
  it('leaves separate facilities where they are', () => {
    const points = spreadOverlapping([
      { id: 'a', lat: 52.2, lng: 21.0 },
      { id: 'b', lat: 52.3, lng: 21.1 },
    ]);
    expect(points).toEqual([
      { id: 'a', lat: 52.2, lng: 21.0 },
      { id: 'b', lat: 52.3, lng: 21.1 },
    ]);
  });

  it('moves facilities at the same spot apart, around that spot', () => {
    const same = { lat: 52.2297, lng: 21.0122 };
    const points = spreadOverlapping([
      { id: 'a', ...same },
      { id: 'b', ...same },
      { id: 'c', lat: same.lat + 0.0001, lng: same.lng },
    ]);
    expect(points.map((p) => p.id)).toEqual(['a', 'b', 'c']);
    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        expect(dist(points[i]!, points[j]!)).toBeGreaterThan(SPREAD_DEG);
      }
      // Stays close to the real place (< ~2× spread in degrees).
      expect(dist(points[i]!, same)).toBeLessThan(SPREAD_DEG * 2);
    }
  });

  it('is deterministic', () => {
    const input = [
      { id: 'a', lat: 52, lng: 21 },
      { id: 'b', lat: 52, lng: 21 },
    ];
    expect(spreadOverlapping(input)).toEqual(spreadOverlapping(input));
  });
});

describe('boundsOf', () => {
  it('covers all points, including the user', () => {
    expect(
      boundsOf([
        { lat: 52.1, lng: 21.2 },
        { lat: 52.4, lng: 20.9 },
        { lat: 52.23, lng: 21.01 },
      ]),
    ).toEqual({ sw: { lat: 52.1, lng: 20.9 }, ne: { lat: 52.4, lng: 21.2 } });
  });

  it('null for no points', () => {
    expect(boundsOf([])).toBeNull();
  });
});
