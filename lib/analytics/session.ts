/**
 * Internal analytics — session lifecycle.
 * Create or get site_sessions by session_token (HttpOnly cookie).
 * Never store raw IP. Never retroactively deanonymize.
 */

import type { Database } from "@/types/database";

type SiteSessionRow = Database["public"]["Tables"]["site_sessions"]["Row"];
type SiteSessionInsert = Database["public"]["Tables"]["site_sessions"]["Insert"];
type SitePageViewInsert = Database["public"]["Tables"]["site_page_views"]["Insert"];

export type SessionContext = {
  session_token: string;
  session_id: string | null;
  user_id: string | null;
  user_role: string | null;
  is_authenticated: boolean;
  is_sandbox: boolean;
};

export type PageViewPayload = {
  path: string;
  referrer: string | null;
  duration_ms?: number | null;
};

export type SessionUpsertPayload = {
  ip_hash: string;
  user_agent: string | null;
  device_type: string | null;
  os: string | null;
  browser: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
  timezone: string | null;
  asn: string | null;
  isp: string | null;
  is_vpn: boolean;
  is_sandbox: boolean;
  user_id: string | null;
  user_role: string | null;
  is_authenticated: boolean;
};
