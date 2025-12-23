import { describe, it } from 'node:test';
import assert from 'node:assert';
import { Limiter, MemoryStore } from '../dist/index.js';

describe('v1.0.2 Correctness Fixes', () => {
  it('should block everything when max is 0 (Fixed)', async () => {
    const store = new MemoryStore();
    const limiter = new Limiter(store);
    const options = { windowMs: 1000, max: 0, algorithm: 'fixed' };
    
    const res = await limiter.check('user1', options);
    assert.strictEqual(res.blocked, true);
    assert.strictEqual(res.remaining, 0);
  });

  it('should block everything when max is 0 (Sliding)', async () => {
    const store = new MemoryStore();
    const limiter = new Limiter(store);
    const options = { windowMs: 1000, max: 0, algorithm: 'sliding' };
    
    const res = await limiter.check('user1', options);
    assert.strictEqual(res.blocked, true);
    assert.strictEqual(res.remaining, 0);
  });

  it('should not have negative remaining count', async () => {
    const store = new MemoryStore();
    const limiter = new Limiter(store);
    const options = { windowMs: 1000, max: 1, algorithm: 'fixed' };
    
    await limiter.check('user1', options); // hit 1
    const res = await limiter.check('user1', options); // hit 2 (blocked)
    assert.strictEqual(res.remaining, 0);
  });
});