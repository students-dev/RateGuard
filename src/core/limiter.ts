import { Store, RateLimitRecord } from './store.js';

export interface RateLimitOptions {
  windowMs: number;
  max: number;
  algorithm: 'fixed' | 'sliding';
}

export interface RateLimitResult {
  blocked: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
}

export class Limiter {
  constructor(private store: Store) {}

  async check(key: string, options: RateLimitOptions): Promise<RateLimitResult> {
    const { windowMs, max, algorithm } = options;
    const now = Date.now();

    // Get current record
    const record = await this.store.get(key);

    let newRecord: RateLimitRecord;
    let hitCount = 0;
    let resetTime = 0;

    if (algorithm === 'fixed') {
      // Fixed Window Logic
      if (record && record.windowStart && (now - record.windowStart) < windowMs) {
        // Current window
        hitCount = (record.count || 0) + 1;
        resetTime = record.windowStart + windowMs;
        newRecord = { ...record, count: hitCount };
      } else {
        // New window
        hitCount = 1;
        resetTime = now + windowMs;
        newRecord = { count: hitCount, windowStart: now };
      }
    } else {
      // Sliding Window (Log) Logic
      const timestamps = record?.timestamps || [];
      const windowStart = now - windowMs;
      
      // Filter out expired timestamps
      const validTimestamps = timestamps.filter(t => t > windowStart);
      
      if (validTimestamps.length >= max) {
        // Blocked - Do not add current timestamp (non-penalizing)
        // But we persist the filtered list to clean up old entries
        hitCount = validTimestamps.length + 1; // Virtual count for headers
        newRecord = { timestamps: validTimestamps };
        
        // Reset time is when the oldest valid timestamp expires
        if (validTimestamps.length > 0) {
            resetTime = validTimestamps[0] + windowMs;
        } else {
            resetTime = now + windowMs;
        }
      } else {
        // Allowed - Add current timestamp
        validTimestamps.push(now);
        hitCount = validTimestamps.length;
        newRecord = { timestamps: validTimestamps };
        
        if (validTimestamps.length > 0) {
            resetTime = validTimestamps[0] + windowMs;
        } else {
            resetTime = now + windowMs;
        }
      }
    }

    const blocked = hitCount > max;
    const remaining = Math.max(0, max - hitCount);

    // Save updated record
    // We update the TTL to keep the record alive for at least another windowMs
    await this.store.set(key, newRecord, windowMs);

    return {
      blocked,
      limit: max,
      remaining: blocked ? 0 : remaining,
      resetTime,
    };
  }
}
