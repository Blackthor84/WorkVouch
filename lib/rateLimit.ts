/**
 * In-memory sliding-window rate limiter. Safe for Vercel serverless; per-instance.
 * For distributed rate limiting across instances, use Redis/Upstash in production.
 * [RATE_LIMIT_BLOCK] when limit exceeded.
 */

import { NextResponse } from "next/server";

type Entry = { count: number; windowStart: number };

const store = new Map<string, Entry>();

const WINDOW_MS = 60 * 1000; // 1 minute
const DEFAULT_MAX_PER_WINDOW = 60;

function now(): number {
  return Date.now();
}

function prune(keyPrefix: string): void {
  const cutoff = now() - WINDOW_MS;
  for (const [k, v] of store.entries()) {
    if (k.startsWith(keyPrefix) && v.windowStart < cutoff) store.delete(k);
  }
}

/**
 * Check rate limit. Returns { allowed: true } or { allowed: false, retryAfterMs }.
 * Keys are combined: prefix + identifier (e.g. ip or userId).
 */
export function checkRateLimit(params: {
  key: string;
  windowMs?: number;
  maxPerWindow?: number;
  prefix?: string;
}): { allowed: boolean; retryAfterMs?: number; count?: number } {
  const { key, windowMs = WINDOW_MS, maxPerWindow = DEFAULT_MAX_PER_WINDOW, prefix = "rl:" } = params;
  const fullKey = `${prefix}${key}`;
  const t = now();
  prune(prefix);

  const entry = store.get(fullKey);
  if (!entry) {
    store.set(fullKey, { count: 1, windowStart: t });
    return { allowed: true, count: 1 };
  }

  if (t - entry.windowStart >= windowMs) {
    entry.count = 1;
    entry.windowStart = t;
    store.set(fullKey, entry);
    return { allowed: true, count: 1 };
  }

  entry.count += 1;
  if (entry.count > maxPerWindow) {
    const retryAfterMs = Math.ceil(windowMs - (t - entry.windowStart));
    return { allowed: false, retryAfterMs: Math.max(0, retryAfterMs), count: entry.count };
  }
  return { allowed: true, count: entry.count };
}

/**
 * Get identifier for request: IP + optional userId for double keying.
 */
export function getRateLimitKey(request: Request, userId?: string | null): string {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip")?.trim()
    || "unknown";
  const u = userId ?? "";
  return `${ip}:${u}`;
}

/**
 * Strict limits for sensitive routes. Call at start of handler.
 * Returns NextResponse with 429 and [RATE_LIMIT_BLOCK] log if over limit.
 */
export function withRateLimit(
  request: Request,
  options: {
    userId?: string | null;
    windowMs?: number;
    maxPerWindow?: number;
    prefix?: string;
  } = {}
): { allowed: true } | { allowed: false; response: NextResponse } {
  const key = getRateLimitKey(request, options.userId);
  const result = checkRateLimit({
    key,
    windowMs: options.windowMs ?? 60_000,
    maxPerWindow: options.maxPerWindow ?? 30,
    prefix: options.prefix ?? "rl:",
  });

  if (result.allowed) {
    return { allowed: true };
  }

  console.warn("[RATE_LIMIT_BLOCK]", {
    key: key.slice(0, 20) + "...",
    count: result.count,
    retryAfterMs: result.retryAfterMs,
    path: new URL(request.url).pathname,
    timestamp: new Date().toISOString(),
  });

  const res = NextResponse.json(
    { error: "Too many requests. Please try again later." },
    {
      status: 429,
      headers: {
        "Retry-After": String(Math.ceil((result.retryAfterMs ?? 60) / 1000)),
      },
    }
  );
  return { allowed: false, response: res };
}

// Presets for route categories
export const RATE_LIMITS = {
  employmentReferences: { windowMs: 60_000, maxPerWindow: 20 },
  admin: { windowMs: 60_000, maxPerWindow: 120 },
  auth: { windowMs: 60_000, maxPerWindow: 30 },
  employer: { windowMs: 60_000, maxPerWindow: 60 },
  sandbox: { windowMs: 60_000, maxPerWindow: 100 },
  defaultWrite: { windowMs: 60_000, maxPerWindow: 30 },
} as const;
