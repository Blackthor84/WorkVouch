/**
 * Safe admin check for Server Components. NEVER throws.
 * Use for navbar and any UI that must render even when auth fails.
 * Auth via getUser(); role from profiles table.
 */

import { supabaseServer } from "@/lib/supabase/server";
import { isAdminRole, normalizeRole } from "@/lib/auth/roles";
import { isSandbox } from "@/lib/app-mode";

export type AdminCheck =
  | { ok: true; user: { id: string; email?: string }; profile: Record<string, unknown>; role: string }
  | { ok: false; reason: string };

export async function requireAdminSafe(): Promise<AdminCheck> {
  try {
    const supabase = await supabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id || !user?.email) {
      return { ok: false, reason: "no_user" };
    }

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (error || !profile) {
      return { ok: false, reason: "not_admin" };
    }

    const rawRole = (profile as { role?: string | null }).role ?? "";
    const role = normalizeRole(rawRole);

    if (!isAdminRole(role)) {
      return { ok: false, reason: "not_admin" };
    }

    if (process.env.NODE_ENV !== "test") {
      console.log("[ADMIN CHECK]", {
        email: user.email,
        role,
        sandbox: isSandbox(),
      });
    }

    const { data: fullProfile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    return {
      ok: true,
      user: { id: user.id, email: user.email ?? undefined },
      profile: (fullProfile as Record<string, unknown>) ?? {},
      role,
    };
  } catch {
    return { ok: false, reason: "error" };
  }
}
