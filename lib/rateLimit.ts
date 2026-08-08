/**
 * Distributed sliding-window rate limiter (Upstash/Redis in production, memory in dev).
 * [RATE_LIMIT_BLOCK] when limit exceeded.
 */

import { NextResponse } from "next/server";
import { getRateLimitStore } from "@/lib/rate-limit";

const WINDOW_MS = 60 * 1000;
const DEFAULT_MAX_PER_WINDOW = 60;

export function getRateLimitKey(request: Request, userId?: string | null): string {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "unknown";
  const u = userId ?? "";
  return `${ip}:${u}`;
}

export async function checkRateLimit(params: {
  key: string;
  windowMs?: number;
  maxPerWindow?: number;
  prefix?: string;
}): Promise<{ allowed: boolean; retryAfterMs?: number; count?: number }> {
  const store = getRateLimitStore();
  return store.check({
    key: params.key,
    windowMs: params.windowMs ?? WINDOW_MS,
    maxPerWindow: params.maxPerWindow ?? DEFAULT_MAX_PER_WINDOW,
    prefix: params.prefix ?? "rl:",
  });
}

/**
 * Strict limits for sensitive routes. Call at start of handler.
 * Returns NextResponse with 429 and [RATE_LIMIT_BLOCK] log if over limit.
 */
export async function withRateLimit(
  request: Request,
  options: {
    userId?: string | null;
    windowMs?: number;
    maxPerWindow?: number;
    prefix?: string;
  } = {}
): Promise<{ allowed: true } | { allowed: false; response: NextResponse }> {
  const key = getRateLimitKey(request, options.userId);
  const result = await checkRateLimit({
    key,
    windowMs: options.windowMs ?? 60_000,
    maxPerWindow: options.maxPerWindow ?? 30,
    prefix: options.prefix ?? "rl:",
  });

  if (result.allowed) {
    return { allowed: true };
  }

  console.warn("[RATE_LIMIT_BLOCK]", {
    store: getRateLimitStore().name,
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

export const RATE_LIMITS = {
  employmentReferences: { windowMs: 60_000, maxPerWindow: 20 },
  admin: { windowMs: 60_000, maxPerWindow: 120 },
  auth: { windowMs: 60_000, maxPerWindow: 30 },
  employer: { windowMs: 60_000, maxPerWindow: 60 },
  sandbox: { windowMs: 60_000, maxPerWindow: 100 },
  defaultWrite: { windowMs: 60_000, maxPerWindow: 30 },
} as const;
