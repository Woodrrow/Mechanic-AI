/**
 * Fixed-window limiter to protect the DVLA/DVSA quotas from a single noisy
 * client. In-memory, so on serverless it is per instance: good enough as a
 * first line, not a security boundary.
 */
export interface RateLimitVerdict {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export class FixedWindowRateLimiter {
  private readonly hits = new Map<string, { count: number; windowStart: number }>();

  constructor(private readonly opts: { windowMs: number; max: number }) {}

  check(key: string, now: number = Date.now()): RateLimitVerdict {
    const entry = this.hits.get(key);
    if (!entry || now - entry.windowStart >= this.opts.windowMs) {
      this.hits.set(key, { count: 1, windowStart: now });
      this.sweep(now);
      return { allowed: true, remaining: this.opts.max - 1, retryAfterSeconds: 0 };
    }
    if (entry.count >= this.opts.max) {
      return {
        allowed: false,
        remaining: 0,
        retryAfterSeconds: Math.max(1, Math.ceil((entry.windowStart + this.opts.windowMs - now) / 1000)),
      };
    }
    entry.count += 1;
    return { allowed: true, remaining: this.opts.max - entry.count, retryAfterSeconds: 0 };
  }

  private sweep(now: number): void {
    if (this.hits.size < 1000) return;
    for (const [key, entry] of this.hits) {
      if (now - entry.windowStart >= this.opts.windowMs) this.hits.delete(key);
    }
  }
}
