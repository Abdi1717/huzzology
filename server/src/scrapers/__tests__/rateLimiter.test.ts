// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RateLimiter } from '../utils/rateLimiter';

describe('RateLimiter', () => {
  beforeEach(() => vi.useFakeTimers());

  it('enforces capacity and refill', async () => {
    const limiter = new RateLimiter({ capacity: 1, refillRate: 1 });

    // First consume should resolve immediately
    await limiter.consume('example.com');

    let resolved = false;
    limiter.consume('example.com').then(() => {
      resolved = true;
    });

    // Fast-forward 500 ms – token not yet refilled
    vi.advanceTimersByTime(500);
    expect(resolved).toBe(false);

    // Fast-forward remaining 500 ms – token should refill
    vi.advanceTimersByTime(500);
    await vi.runOnlyPendingTimersAsync();
    expect(resolved).toBe(true);
  });
});