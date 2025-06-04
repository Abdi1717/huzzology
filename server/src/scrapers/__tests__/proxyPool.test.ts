// @ts-nocheck
import { describe, it, expect } from 'vitest';
import { ProxyPool } from '../utils/proxyPool';

describe('ProxyPool', () => {
  it('rotates proxies round-robin and respects failures', () => {
    const pool = new ProxyPool(['p1', 'p2']);

    expect(pool.next()).toBe('p1');
    expect(pool.next()).toBe('p2');
    expect(pool.next()).toBe('p1');

    // Mark p1 as failed 3 times quickly
    pool.reportFailure('p1');
    pool.reportFailure('p1');
    pool.reportFailure('p1');

    // Immediately after failures, p1 should be skipped
    expect(pool.next()).toBe('p2');
  });
});