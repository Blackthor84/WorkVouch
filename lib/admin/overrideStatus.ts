/**
 * Production override status. Used to allow mutations in production when founder has enabled time-boxed override.
 */

import { getSupabaseServer } from "@/lib/supabase/admin";

export type AdminOverrideStatus = {
  active: boolean;
  expiresAt: string | null;
};

/**
 * Returns current override status from DB. Cache briefly (30–60s) at call site if needed.
 */
export async function getAdminOverrideStatus(): Promise<AdminOverrideStatus> {
  const supabase = getSupabaseServer() as any;
  const now = new Date().toISOString();
  const { data } = await supabase
    .from("admin_override")
    .select("id, expires_at")
    .eq("enabled", true)
    .gt("expires_at", now)
    .maybeSingle();
  if (data && data.expires_at) {
    return { active: true, expiresAt: data.expires_at };
  }
  return { active: false, expiresAt: null };
}
