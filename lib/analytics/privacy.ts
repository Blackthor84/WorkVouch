/**
 * Internal analytics — privacy-safe helpers.
 * GDPR/CCPA: hash IPs before storage. No raw IP. No PII in event metadata.
 */

import { createHash } from "crypto";

const SALT_ENV = "ANALYTICS_IP_HASH_SALT";
const DEFAULT_SALT = "workvouch-internal-analytics-v1";

function getSalt(): string {
  return process.env[SALT_ENV]?.trim() || DEFAULT_SALT;
}

/** Hash IP for storage. Never store raw IP. */
export function hashIp(ip: string): string {
  const salt = getSalt();
  return createHash("sha256").update(salt + "|" + (ip || "").trim()).digest("hex");
}

/** Geo from request headers (Vercel, Cloudflare, etc.). Approx only. */
export function getGeoFromHeaders(headers: Headers): {
  country: string | null;
  region: string | null;
  city: string | null;
} {
  const country =
    headers.get("x-vercel-ip-country") ??
    headers.get("cf-ipcountry") ??
    headers.get("x-country-code") ??
    null;
  const region =
    headers.get("x-vercel-ip-country-region") ??
    headers.get("x-region") ??
    null;
  const city =
    headers.get("x-vercel-ip-city") ??
    headers.get("x-city") ??
    null;
  return {
    country: country?.trim() || null,
    region: region?.trim() || null,
    city: city?.trim() || null,
  };
}

/** Client IP from request (for hashing only). */
export function getClientIp(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headers.get("x-real-ip")?.trim() ??
    headers.get("cf-connecting-ip")?.trim() ??
    ""
  );
}

/** Rough device type from user-agent. No PII. */
export function getDeviceType(userAgent: string | null): string {
  if (!userAgent?.length) return "unknown";
  const ua = userAgent.toLowerCase();
  if (ua.includes("mobile") && !ua.includes("ipad")) return "mobile";
  if (ua.includes("tablet") || ua.includes("ipad")) return "tablet";
  return "desktop";
}

/** Parse OS from user-agent. No PII. */
export function getOs(userAgent: string | null): string | null {
  if (!userAgent?.length) return null;
  const ua = userAgent.toLowerCase();
  if (ua.includes("windows")) return "Windows";
  if (ua.includes("mac os") || ua.includes("macintosh")) return "macOS";
  if (ua.includes("linux") && !ua.includes("android")) return "Linux";
  if (ua.includes("android")) return "Android";
  if (ua.includes("iphone") || ua.includes("ipad")) return "iOS";
  return null;
}

/** Parse browser from user-agent. No PII. */
export function getBrowser(userAgent: string | null): string | null {
  if (!userAgent?.length) return null;
  const ua = userAgent.toLowerCase();
  if (ua.includes("edg/")) return "Edge";
  if (ua.includes("chrome") && !ua.includes("chromium")) return "Chrome";
  if (ua.includes("safari") && !ua.includes("chrome")) return "Safari";
  if (ua.includes("firefox")) return "Firefox";
  return null;
}

/** Timezone from request header if present (e.g. Cloudflare). */
export function getTimezone(headers: Headers): string | null {
  return headers.get("cf-ipcountry-timezone") ?? headers.get("x-timezone") ?? null;
}

/** VPN/proxy hint from headers if available (e.g. Cloudflare threat). */
export function getIsVpn(headers: Headers): boolean {
  const threat = headers.get("cf-threat-metadata");
  if (threat) {
    try {
      const j = JSON.parse(threat) as { vpn?: boolean };
      return j?.vpn === true;
    } catch {
      return false;
    }
  }
  return false;
}
