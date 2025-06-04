/**
 * Simple in-memory token-bucket rate limiter.
 *
 * This utility is *not* production-ready but provides the baseline interface
 * needed for subsequent subtasks. A distributed variant (e.g. Redis-backed)
 * can replace this implementation transparently by preserving the public API.
 */

// @ts-ignore – global setTimeout is available in Node typings but may not be
// included in the current tsconfig lib set. The ignore ensures compilation
// even if lib.dom is not present.
const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

interface BucketOptions {
  capacity: number; // maximum tokens in bucket
  refillRate: number; // tokens added per second
}

class TokenBucket {
  private tokens: number;
  private readonly capacity: number;
  private readonly refillRate: number;
  private lastRefill: number;

  constructor({ capacity, refillRate }: BucketOptions) {
    this.capacity = capacity;
    this.refillRate = refillRate;
    this.tokens = capacity;
    this.lastRefill = Date.now();
  }

  /** Attempt to consume a single token. Waits if bucket is empty. */
  public async consume(): Promise<void> {
    while (true) {
      this.refill();
      if (this.tokens > 0) {
        this.tokens -= 1;
        return;
      }
      // Sleep for ~100 ms before retrying
      await sleep(100);
    }
  }

  private refill(): void {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000; // seconds
    const tokensToAdd = elapsed * this.refillRate;
    if (tokensToAdd > 0) {
      this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
      this.lastRefill = now;
    }
  }
}

/**
 * Maintain one bucket per host or any arbitrary key (e.g. platform name).
 */
export class RateLimiter {
  private readonly buckets = new Map<string, TokenBucket>();

  constructor(private readonly defaults: BucketOptions = { capacity: 5, refillRate: 1 }) {}

  public async consume(key: string): Promise<void> {
    if (!this.buckets.has(key)) {
      this.buckets.set(key, new TokenBucket(this.defaults));
    }
    return this.buckets.get(key)!.consume();
  }
}