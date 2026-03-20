/**
 * Admin API: only users with profiles.role = super_admin (or legacy superadmin) may access.
 * Uses cookie session (createClient) for auth.getUser(); profile.role via admin client.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export type SuperAdminAuth = { userId: string };

function normalizeProfileRole(role: string | null | undefined): string {
  return String(role ?? "")
    .toLowerCase()
    .trim()
    .replace(/-/g, "_");
}

/**
 * Returns { userId } or a NextResponse (401/403).
 */
export async function requireSuperAdminApi(): Promise<SuperAdminAuth | NextResponse> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      console.warn("[requireSuperAdminApi] profiles select failed", profileError.message);
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const r = normalizeProfileRole((profile as { role?: string } | null)?.role);
    const isSuper = r === "super_admin" || r === "superadmin";

    if (!isSuper) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    return { userId: user.id };
  } catch (e) {
    console.warn("[requireSuperAdminApi] error", e);
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
}
