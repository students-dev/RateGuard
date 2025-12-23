import { Limiter } from '../core/limiter.js';
import { Store } from '../core/store.js';
import { MemoryStore } from '../stores/memory.js';
import { HEADERS } from '../core/headers.js';
import { ConfigurationError } from '../core/errors.js';

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
  // Support for common proxy headers and IPv6 normalization
  const ip = 
    req.headers['x-forwarded-for']?.split(',')[0].trim() || 
    req.ip || 
    req.socket?.remoteAddress || 
    '127.0.0.1';

  // Basic IPv6 normalization: [::1] -> 127.0.0.1
  if (ip === '::1' || ip === '::ffff:127.0.0.1') {
    return '127.0.0.1';
  }

  return ip;
};

function validateOptions(options: RateGuardOptions) {
  if (typeof options.windowMs !== 'number' || options.windowMs <= 0) {
    throw new ConfigurationError('windowMs must be a positive number.');
  }
  if (typeof options.max !== 'number' || options.max < 0) {
    throw new ConfigurationError('max must be a non-negative number.');
  }
}

export function rateGuard(options: RateGuardOptions) {
  validateOptions(options);

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
