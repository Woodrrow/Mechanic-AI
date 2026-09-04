import { describe, expect, it } from "vitest";
import { FixedWindowRateLimiter } from "./rate-limit";

describe("FixedWindowRateLimiter", () => {
  it("allows up to max per window then blocks with a retry hint", () => {
    const limiter = new FixedWindowRateLimiter({ windowMs: 60_000, max: 3 });
    const t0 = 1_000_000;
    expect(limiter.check("a", t0).allowed).toBe(true);
    expect(limiter.check("a", t0 + 1).allowed).toBe(true);
    expect(limiter.check("a", t0 + 2).allowed).toBe(true);
    const blocked = limiter.check("a", t0 + 10_000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBe(50);
    expect(limiter.check("b", t0 + 10_000).allowed).toBe(true); // other keys unaffected
    expect(limiter.check("a", t0 + 60_000).allowed).toBe(true); // new window
  });
});
