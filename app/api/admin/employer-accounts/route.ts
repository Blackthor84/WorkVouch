import { getCurrentUser, getCurrentUserRole } from "@/lib/auth";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/roles";
import { NextResponse } from "next/server";

/**
 * GET /api/admin/employer-accounts
 * List employer accounts for admin (e.g. feature flag assign dropdown). Admin + SuperAdmin only.
 */
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const role = await getCurrentUserRole();
    if (!isAdmin(role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const supabase = getSupabaseServer();
    const { data, error } = await (supabase as any)
      .from("employer_accounts")
      .select("id, company_name, user_id")
      .order("company_name");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data || []);
  } catch (err) {
    console.error("Admin employer-accounts GET error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
