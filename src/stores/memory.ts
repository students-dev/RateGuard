import { Store, RateLimitRecord } from '../core/store.js';

export class MemoryStore implements Store {
  private data = new Map<string, { value: RateLimitRecord; expiresAt: number }>();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(cleanupIntervalMs: number = 60000) {
    if (cleanupIntervalMs > 0) {
      this.cleanupInterval = setInterval(() => this.cleanup(), cleanupIntervalMs);
      if (this.cleanupInterval.unref) {
        this.cleanupInterval.unref();
      }
    }
  }

  async get(key: string): Promise<RateLimitRecord | undefined> {
    const entry = this.data.get(key);
    if (!entry) return undefined;

    if (Date.now() > entry.expiresAt) {
      this.data.delete(key);
      return undefined;
    }

    return entry.value;
  }

  async set(key: string, value: RateLimitRecord, ttlMs: number): Promise<void> {
    const expiresAt = Date.now() + ttlMs;
    this.data.set(key, { value, expiresAt });
  }

  async delete(key: string): Promise<void> {
    this.data.delete(key);
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.data.entries()) {
      if (now > entry.expiresAt) {
        this.data.delete(key);
      }
    }
  }
}
