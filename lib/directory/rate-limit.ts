/**
 * In-memory rate limit for public directory search. Max 10 searches per hour per IP.
 * For production consider Redis or Vercel KV.
 */

const windowMs = 60 * 60 * 1000; // 1 hour
const maxSearches = 10;

type Entry = { count: number; resetAt: number };

const store = new Map<string, Entry>();

function getKey(ip: string): string {
  return `dir_public_${ip}`;
}

export function checkPublicDirectoryRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const key = getKey(ip);
  let entry = store.get(key);
  if (!entry || now >= entry.resetAt) {
    entry = { count: 0, resetAt: now + windowMs };
    store.set(key, entry);
  }
  const remaining = Math.max(0, maxSearches - entry.count);
  return { allowed: entry.count < maxSearches, remaining };
}

export function consumePublicDirectoryRateLimit(ip: string): boolean {
  const now = Date.now();
  const key = getKey(ip);
  let entry = store.get(key);
  if (!entry || now >= entry.resetAt) {
    entry = { count: 0, resetAt: now + windowMs };
    store.set(key, entry);
  }
  if (entry.count >= maxSearches) return false;
  entry.count += 1;
  return true;
}
