export interface CacheEntry<V> {
  value: V;
  /** epoch ms; after this the entry is stale but still served (stale-while-revalidate) */
  freshUntil: number;
}

/**
 * Minimal LRU on a Map (insertion order = recency). Entries are not dropped when stale —
 * staleness only triggers a refresh; size is bounded by maxEntries.
 */
export class LruCache<V> {
  private readonly map = new Map<string, CacheEntry<V>>();

  constructor(
    private readonly maxEntries: number,
    private readonly now: () => number,
  ) {}

  get(key: string): CacheEntry<V> | undefined {
    const entry = this.map.get(key);
    if (entry) {
      this.map.delete(key);
      this.map.set(key, entry);
    }
    return entry;
  }

  set(key: string, value: V, ttlMs: number): void {
    this.map.delete(key);
    this.map.set(key, { value, freshUntil: this.now() + ttlMs });
    if (this.map.size > this.maxEntries) {
      const oldest = this.map.keys().next().value;
      if (oldest !== undefined) this.map.delete(oldest);
    }
  }

  isFresh(entry: CacheEntry<V>): boolean {
    return this.now() < entry.freshUntil;
  }

  get size(): number {
    return this.map.size;
  }
}
