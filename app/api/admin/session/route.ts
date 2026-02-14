import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/session
 * Returns { role: "admin" | "superadmin" | null } for the authenticated user.
 * Never throws, never 404. Client components use this as the single source for admin visibility.
 */
export async function GET() {
  try {
    const supabase = await supabaseServer();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const email = session?.user?.email;
    if (!email) {
      return NextResponse.json({ role: null });
    }

    const { data } = await supabase
      .from("admin_users")
      .select("role")
      .eq("email", email)
      .maybeSingle();

    const role = data?.role ?? null;
    const normalized =
      role === "admin" || role === "superadmin" || role === "super_admin"
        ? (role === "super_admin" ? "superadmin" : role)
        : null;

    return NextResponse.json({
      role: normalized as "admin" | "superadmin" | null,
    });
  } catch {
    return NextResponse.json({ role: null });
  }
}
