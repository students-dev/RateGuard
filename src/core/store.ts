/**
 * Interface for a value stored in the rate limiter.
 * This structure allows supporting both fixed and sliding window algorithms.
 */
export interface RateLimitRecord {
  /**
   * For fixed window: The count of requests.
   * For sliding window: The list of timestamps.
   */
  count?: number;
  timestamps?: number[];
  
  /**
   * The timestamp when the current window started (for fixed window).
   */
  windowStart?: number;
}

/**
 * Interface for the storage backend.
 */
export interface Store {
  /**
   * value: The data to store.
   * ttlMs: Time to live in milliseconds.
   */
  set(key: string, value: RateLimitRecord, ttlMs: number): Promise<void>;
  
  get(key: string): Promise<RateLimitRecord | undefined>;
  
  delete(key: string): Promise<void>;
}
