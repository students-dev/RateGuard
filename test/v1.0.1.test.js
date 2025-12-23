import { describe, it } from 'node:test';
import assert from 'node:assert';
import { rateGuard, ConfigurationError } from '../dist/index.js';

describe('v1.0.1 Safer Defaults', () => {
  describe('Input Validation', () => {
    it('should throw on negative windowMs', () => {
      assert.throws(() => {
        rateGuard({ windowMs: -1, max: 10 });
      }, (err) => err instanceof ConfigurationError);
    });

    it('should throw on zero windowMs', () => {
        assert.throws(() => {
          rateGuard({ windowMs: 0, max: 10 });
        }, (err) => err instanceof ConfigurationError);
      });

    it('should throw on negative max', () => {
      assert.throws(() => {
        rateGuard({ windowMs: 1000, max: -1 });
      }, (err) => err instanceof ConfigurationError);
    });
  });
});