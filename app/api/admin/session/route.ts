import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { normalizeRole } from "@/lib/auth/normalizeRole";
import { isAdminRole } from "@/lib/auth/roles";

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
      data: { session },
    } = await supabase.auth.getSession();

    const email = session?.user?.email ?? null;
    if (!email) {
      return NextResponse.json({ role: null });
    }

    const { data } = await supabase
      .from("admin_users")
      .select("role")
      .eq("email", email)
      .maybeSingle();

    const rawRole = (data as { role?: string | null } | null)?.role ?? null;
    const normalized = rawRole ? normalizeRole(rawRole) : "";
    const role = isAdminRole(normalized) ? (normalized as "admin" | "super_admin") : null;

    if (process.env.NODE_ENV !== "test") {
      console.log("[ADMIN CHECK]", { email, role, sandbox: process.env.NEXT_PUBLIC_SANDBOX_MODE === "true" });
    }

    return NextResponse.json({ role });
  } catch {
    return NextResponse.json({ role: null });
  }
}
