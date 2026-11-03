// TTL in-memory cache (Metehan kalibi)
type Entry<T> = { value: T; expires: number };

export class TTLCache {
  private store = new Map<string, Entry<unknown>>();

  get<T>(key: string): T | undefined {
    const e = this.store.get(key);
    if (!e) return undefined;
    if (Date.now() > e.expires) {
      this.store.delete(key);
      return undefined;
    }
    return e.value as T;
  }

  set<T>(key: string, value: T, ttlMs: number): void {
    this.store.set(key, { value, expires: Date.now() + ttlMs });
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  size(): number {
    return this.store.size;
  }
}

export const cache = new TTLCache();

export const TTL = {
  quote: 60_000,
  history: 5 * 60_000,
  fundamentals: 30 * 60_000,
  macro: 30 * 60_000,
  fx: 60_000,
  tefas: 10 * 60_000,
  kap: 5 * 60_000,
  health: 30_000,
} as const;