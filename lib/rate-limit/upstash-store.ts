import type { RateLimitCheckResult, RateLimitStore } from "./types";

/** Upstash Redis REST sliding-window rate limiter. */
export class UpstashRateLimitStore implements RateLimitStore {
  readonly name = "upstash";

  constructor(
    private readonly restUrl: string,
    private readonly restToken: string
  ) {}

  async check(params: {
    key: string;
    windowMs: number;
    maxPerWindow: number;
    prefix: string;
  }): Promise<RateLimitCheckResult> {
    const fullKey = `${params.prefix}${params.key}`;
    const windowSec = Math.max(1, Math.ceil(params.windowMs / 1000));

    try {
      const response = await fetch(`${this.restUrl}/pipeline`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.restToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify([
          ["INCR", fullKey],
          ["TTL", fullKey],
        ]),
      });

      if (!response.ok) {
        return { allowed: true, count: 1 };
      }

      const results = (await response.json()) as { result: number }[];
      const count = results[0]?.result ?? 1;
      const ttl = results[1]?.result ?? -1;

      if (count === 1 || ttl === -1) {
        await fetch(`${this.restUrl}/expire/${encodeURIComponent(fullKey)}/${windowSec}`, {
          method: "POST",
          headers: { Authorization: `Bearer ${this.restToken}` },
        });
      }

      if (count > params.maxPerWindow) {
        const retryAfterMs = ttl > 0 ? ttl * 1000 : params.windowMs;
        return { allowed: false, retryAfterMs, count };
      }
      return { allowed: true, count };
    } catch {
      return { allowed: true, count: 1 };
    }
  }
}
