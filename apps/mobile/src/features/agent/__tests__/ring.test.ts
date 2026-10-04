import { ringSegments } from '../ring';

describe('ringSegments', () => {
  it('no phone time: an empty ring', () => {
    expect(ringSegments(0, 0)).toEqual({ waited: 0, talked: 0 });
  });

  it('splits the ring in proportion to the time', () => {
    expect(ringSegments(30, 30)).toEqual({ waited: 30, talked: 30 });
    expect(ringSegments(45, 15)).toEqual({ waited: 45, talked: 15 });
  });

  it('a part that exists never disappears, and never takes the whole ring from the other', () => {
    expect(ringSegments(1, 10_000)).toEqual({ waited: 1, talked: 59 });
    expect(ringSegments(10_000, 1)).toEqual({ waited: 59, talked: 1 });
  });

  it('only one kind of time fills the ring', () => {
    expect(ringSegments(120, 0)).toEqual({ waited: 60, talked: 0 });
    expect(ringSegments(0, 120)).toEqual({ waited: 0, talked: 60 });
  });
});
