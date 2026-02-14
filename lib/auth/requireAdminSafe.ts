/**
 * Safe admin check for Server Components. NEVER throws.
 * Use for navbar and any UI that must render even when auth fails.
 * All checks from admin_users table.
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

    if (!session?.user?.id || !session?.user?.email) {
      return { ok: false, reason: "no_user" };
    }

    const { data: adminRow, error } = await supabase
      .from("admin_users")
      .select("role")
      .eq("email", session.user.email)
      .maybeSingle();

    if (error || !adminRow) {
      return { ok: false, reason: "not_admin" };
    }

    const rawRole = (adminRow as { role?: string | null }).role ?? "";
    const role = normalizeRole(rawRole);

    if (!isAdminRole(role)) {
      return { ok: false, reason: "not_admin" };
    }

    if (process.env.NODE_ENV !== "test") {
      console.log("[ADMIN CHECK]", {
        email: session.user.email,
        role,
        sandbox: process.env.NEXT_PUBLIC_SANDBOX_MODE === "true",
      });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();

    return {
      ok: true,
      user: { id: session.user.id, email: session.user.email ?? undefined },
      profile: (profile as Record<string, unknown>) ?? {},
      role,
    };
  } catch {
    return { ok: false, reason: "error" };
  }
}
