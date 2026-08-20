import type { RateLimitCheckResult, RateLimitStore } from "./types";

type RedisClient = {
  incr(key: string): Promise<number>;
  pttl(key: string): Promise<number>;
  pexpire(key: string, ms: number): Promise<number>;
};

/** Standard Redis (TCP) sliding-window rate limiter via REDIS_URL. */
export class RedisRateLimitStore implements RateLimitStore {
  readonly name = "redis";
  private clientPromise: Promise<RedisClient> | null = null;

  constructor(private readonly redisUrl: string) {}

  private async getClient(): Promise<RedisClient> {
    if (!this.clientPromise) {
      this.clientPromise = import("ioredis").then(({ default: Redis }) => {
        const client = new Redis(this.redisUrl, {
          maxRetriesPerRequest: 1,
          lazyConnect: true,
          enableOfflineQueue: false,
        });
        return {
          incr: (key) => client.incr(key),
          pttl: (key) => client.pttl(key),
          pexpire: (key, ms) => client.pexpire(key, ms),
        };
      });
    }
    return this.clientPromise;
  }

  async check(params: {
    key: string;
    windowMs: number;
    maxPerWindow: number;
    prefix: string;
  }): Promise<RateLimitCheckResult> {
    const fullKey = `${params.prefix}${params.key}`;
    try {
      const client = await this.getClient();
      const count = await client.incr(fullKey);
      if (count === 1) {
        await client.pexpire(fullKey, params.windowMs);
      }
      const ttl = await client.pttl(fullKey);
      if (count > params.maxPerWindow) {
        return {
          allowed: false,
          retryAfterMs: ttl > 0 ? ttl : params.windowMs,
          count,
        };
      }
      return { allowed: true, count };
    } catch {
      return { allowed: true, count: 1 };
    }
  }
}
