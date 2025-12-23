import { Limiter } from '../core/limiter.js';
import { Store } from '../core/store.js';
import { MemoryStore } from '../stores/memory.js';
import { HEADERS } from '../core/headers.js';

export interface RateGuardOptions {
  windowMs: number;
  max: number;
  algorithm?: 'fixed' | 'sliding';
  message?: string;
  statusCode?: number;
  keyGenerator?: (req: any) => string;
  store?: Store;
}

const defaultKeyGenerator = (req: any): string => {
  return req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
};

export function rateGuard(options: RateGuardOptions) {
  const windowMs = options.windowMs;
  const max = options.max;
  const algorithm = options.algorithm || 'fixed';
  const message = options.message || 'Too many requests, please try again later.';
  const statusCode = options.statusCode || 429;
  const keyGenerator = options.keyGenerator || defaultKeyGenerator;
  
  const store = options.store || new MemoryStore();
  const limiter = new Limiter(store);

  return async (req: any, res: any, next: any) => {
    try {
      const key = keyGenerator(req);
      const result = await limiter.check(key, { windowMs, max, algorithm });

      // Set Headers
      // We check if setHeader exists (Node/Express)
      if (typeof res.setHeader === 'function') {
        res.setHeader(HEADERS.LIMIT, result.limit);
        res.setHeader(HEADERS.REMAINING, result.remaining);
        // Using Epoch seconds for Reset header
        res.setHeader(HEADERS.RESET, Math.ceil(result.resetTime / 1000));
      }

      if (result.blocked) {
         if (typeof res.status === 'function') {
           res.status(statusCode);
         } else {
           res.statusCode = statusCode;
         }
         
         if (typeof res.send === 'function') {
           res.send(message);
         } else {
           res.end(message);
         }
         
         return;
      }

      next();
    } catch (error) {
      // Fail open: Log error and proceed
      // We avoid console.error to keep logs clean unless specifically requested?
      // "Never crash the server on internal errors (fail open)"
      // Silent failure is often preferred in production middleware unless debug is on.
      // But for v1.0.0, maybe a simple console.error is helpful for debugging.
      // I'll leave it out or minimal.
      next();
    }
  };
}
