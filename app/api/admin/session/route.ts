import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { normalizeRole } from "@/lib/auth/normalizeRole";
import { isAdminRole } from "@/lib/auth/roles";
import { isSandbox } from "@/lib/app-mode";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/session
 * Returns { role: "admin" | "super_admin" | null } for the authenticated user (from admin_users only).
 * Never throws, never 404. Client components use this as the single source for admin visibility.
 */
export async function GET() {
  try {
    const supabase = await supabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id) {
      return NextResponse.json({ role: null });
    }

    const { data } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    const rawRole = (data as { role?: string | null } | null)?.role ?? null;
    const normalized = rawRole ? normalizeRole(rawRole) : "";
    const role = isAdminRole(normalized) ? (normalized as "admin" | "super_admin") : null;

    if (process.env.NODE_ENV !== "test") {
      console.log("[ADMIN CHECK]", { email: user.email, role, sandbox: isSandbox() });
    }

    return NextResponse.json({ role });
  } catch {
    return NextResponse.json({ role: null });
  }
}
