import { describe, it } from 'node:test';
import assert from 'node:assert';
import { Limiter, MemoryStore, rateGuard } from '../dist/index.js';

describe('RateGuard Core', () => {
  describe('Fixed Window', () => {
    it('should allow requests within limit', async () => {
      const store = new MemoryStore();
      const limiter = new Limiter(store);
      const key = 'user_fixed_1';
      
      const res1 = await limiter.check(key, { windowMs: 1000, max: 2, algorithm: 'fixed' });
      assert.strictEqual(res1.blocked, false);
      assert.strictEqual(res1.remaining, 1);
      
      const res2 = await limiter.check(key, { windowMs: 1000, max: 2, algorithm: 'fixed' });
      assert.strictEqual(res2.blocked, false);
      assert.strictEqual(res2.remaining, 0);
      
      const res3 = await limiter.check(key, { windowMs: 1000, max: 2, algorithm: 'fixed' });
      assert.strictEqual(res3.blocked, true);
    });

    it('should reset after window expires', async () => {
      const store = new MemoryStore();
      const limiter = new Limiter(store);
      const key = 'user_fixed_2';
      
      await limiter.check(key, { windowMs: 50, max: 1, algorithm: 'fixed' });
      const resBlocked = await limiter.check(key, { windowMs: 50, max: 1, algorithm: 'fixed' });
      assert.strictEqual(resBlocked.blocked, true);
      
      await new Promise(r => setTimeout(r, 60));
      
      const resReset = await limiter.check(key, { windowMs: 50, max: 1, algorithm: 'fixed' });
      assert.strictEqual(resReset.blocked, false);
    });
  });

  describe('Sliding Window', () => {
    it('should behave like a sliding window', async () => {
      const store = new MemoryStore();
      const limiter = new Limiter(store);
      const key = 'user_sliding_1';
      const windowMs = 100;
      
      // Hit 1 at t=0
      await limiter.check(key, { windowMs, max: 2, algorithm: 'sliding' });
      
      // Hit 2 at t=20
      await new Promise(r => setTimeout(r, 20));
      await limiter.check(key, { windowMs, max: 2, algorithm: 'sliding' });
      
      // Hit 3 at t=40 (Blocked, count is 2)
      await new Promise(r => setTimeout(r, 20));
      const resBlocked = await limiter.check(key, { windowMs, max: 2, algorithm: 'sliding' });
      assert.strictEqual(resBlocked.blocked, true);
      
      // Wait until t=110.
      // Window is [10, 110].
      // Hit 1 (t=0) is OUT.
      // Hit 2 (t=20) is IN.
      // Count should be 1.
      await new Promise(r => setTimeout(r, 70));
      
      const resAllowed = await limiter.check(key, { windowMs, max: 2, algorithm: 'sliding' });
      assert.strictEqual(resAllowed.blocked, false);
      assert.strictEqual(resAllowed.remaining, 0); // Used 1 (old) + 1 (new) = 2. Remaining 0.
    });
  });
});

describe('MemoryStore', () => {
  it('should expire keys correctly', async () => {
    const store = new MemoryStore(); // Default cleanup 60s
    await store.set('key_ttl', { count: 1 }, 20);
    
    const val1 = await store.get('key_ttl');
    assert.ok(val1);
    
    await new Promise(r => setTimeout(r, 30));
    
    const val2 = await store.get('key_ttl');
    assert.strictEqual(val2, undefined);
  });
});

describe('Express Adapter', () => {
    it('should work as middleware', async () => {
        const mw = rateGuard({ windowMs: 1000, max: 1, algorithm: 'fixed' });
        const req = { ip: '127.0.0.1', headers: {} };
        const res = {
            headers: {},
            setHeader(k, v) { this.headers[k] = v; },
            statusCode: 200,
            end(msg) { this.body = msg; }
        };
        const next = () => { res.calledNext = true; };
        
        await mw(req, res, next);
        assert.strictEqual(res.calledNext, true);
        assert.strictEqual(res.headers['X-RateLimit-Remaining'], 0);
        
        res.calledNext = false;
        await mw(req, res, next);
        assert.strictEqual(res.calledNext, false); // Blocked
        assert.strictEqual(res.statusCode, 429);
    });
});
