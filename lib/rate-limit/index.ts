import type { RateLimitStore, RateLimitStoreKind } from "./types";
import { MemoryRateLimitStore } from "./memory-store";
import { UpstashRateLimitStore } from "./upstash-store";
import { RedisRateLimitStore } from "./redis-store";

let cachedStore: RateLimitStore | null = null;

function resolveStoreKind(): RateLimitStoreKind {
  const explicit = process.env.RATE_LIMIT_STORE as RateLimitStoreKind | undefined;
  if (explicit === "memory" || explicit === "redis" || explicit === "upstash") {
    return explicit;
  }
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    return "upstash";
  }
  if (process.env.REDIS_URL) {
    return "redis";
  }
  return process.env.NODE_ENV === "production" ? "upstash" : "memory";
}

/** Returns shared rate limit store — Upstash, Redis, or in-memory (dev only). */
export function getRateLimitStore(): RateLimitStore {
  if (cachedStore) return cachedStore;

  const kind = resolveStoreKind();
  if (kind === "upstash") {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (url && token) {
      cachedStore = new UpstashRateLimitStore(url, token);
      return cachedStore;
    }
  }
  if (kind === "redis" && process.env.REDIS_URL) {
    cachedStore = new RedisRateLimitStore(process.env.REDIS_URL);
    return cachedStore;
  }

  cachedStore = new MemoryRateLimitStore();
  return cachedStore;
}

export function resetRateLimitStoreForTests(): void {
  cachedStore = null;
}

export { MemoryRateLimitStore, UpstashRateLimitStore, RedisRateLimitStore };
