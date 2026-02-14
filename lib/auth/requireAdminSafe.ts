/**
 * Safe admin check for Server Components. NEVER throws.
 * Use for navbar and any UI that must render even when auth fails.
 */

import { supabaseServer } from "@/lib/supabase/server";
import { isAdminRole, normalizeRole } from "@/lib/auth/roles";

export type AdminCheck =
  | { ok: true; user: { id: string; email?: string }; profile: Record<string, unknown>; role: string }
  | { ok: false; reason: string };

export async function requireAdminSafe(): Promise<AdminCheck> {
  try {
    const supabase = await supabaseServer();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user?.id) {
      return { ok: false, reason: "no_user" };
    }

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();

    if (error || !profile) {
      return { ok: false, reason: "no_profile" };
    }

    const rawRole = (profile as { role?: string | null }).role ?? "";
    const role = normalizeRole(rawRole);

    if (!isAdminRole(role)) {
      return { ok: false, reason: "not_admin" };
    }

    return {
      ok: true,
      user: { id: session.user.id, email: session.user.email ?? undefined },
      profile: profile as Record<string, unknown>,
      role,
    };
  } catch {
    return { ok: false, reason: "error" };
  }
}
