import type { RateLimitCheckResult, RateLimitStore } from "./types";

type Entry = { count: number; windowStart: number };

export class MemoryRateLimitStore implements RateLimitStore {
  readonly name = "memory";
  private readonly store = new Map<string, Entry>();

  async check(params: {
    key: string;
    windowMs: number;
    maxPerWindow: number;
    prefix: string;
  }): Promise<RateLimitCheckResult> {
    const fullKey = `${params.prefix}${params.key}`;
    const t = Date.now();
    this.prune(params.prefix, params.windowMs, t);

    const entry = this.store.get(fullKey);
    if (!entry) {
      this.store.set(fullKey, { count: 1, windowStart: t });
      return { allowed: true, count: 1 };
    }

    if (t - entry.windowStart >= params.windowMs) {
      entry.count = 1;
      entry.windowStart = t;
      this.store.set(fullKey, entry);
      return { allowed: true, count: 1 };
    }

    entry.count += 1;
    if (entry.count > params.maxPerWindow) {
      const retryAfterMs = Math.ceil(params.windowMs - (t - entry.windowStart));
      return { allowed: false, retryAfterMs: Math.max(0, retryAfterMs), count: entry.count };
    }
    return { allowed: true, count: entry.count };
  }

  private prune(prefix: string, windowMs: number, now: number): void {
    const cutoff = now - windowMs;
    for (const [k, v] of this.store.entries()) {
      if (k.startsWith(prefix) && v.windowStart < cutoff) this.store.delete(k);
    }
  }
}
