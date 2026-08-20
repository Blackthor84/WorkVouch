export interface RateLimitCheckResult {
  allowed: boolean;
  retryAfterMs?: number;
  count?: number;
}

export interface RateLimitStore {
  readonly name: string;
  check(params: {
    key: string;
    windowMs: number;
    maxPerWindow: number;
    prefix: string;
  }): Promise<RateLimitCheckResult>;
}

export type RateLimitStoreKind = "memory" | "upstash" | "redis";
