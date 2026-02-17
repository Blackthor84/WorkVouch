import { getCurrentUser, getCurrentUserRole } from "@/lib/auth";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { isSuperAdmin } from "@/lib/roles";
import { NextResponse } from "next/server";


export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEMO_MAX_AGE_HOURS = 48;

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const role = await getCurrentUserRole();
    if (!isSuperAdmin(role)) return NextResponse.json({ error: "Forbidden: superadmin only" }, { status: 403 });

    const supabase = getSupabaseServer() as any;
    const cutoff = new Date(Date.now() - DEMO_MAX_AGE_HOURS * 60 * 60 * 1000).toISOString();

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id")
      .eq("demo_account", true)
      .lt("created_at", cutoff);

    const ids = (profiles ?? []).map((p: { id: string }) => p.id);
    if (ids.length === 0) {
      return NextResponse.json({ deleted: 0, message: "No demo accounts older than 48h" });
    }

    for (const userId of ids) {
      try {
        await supabase.from("employer_accounts").delete().eq("user_id", userId);
      } catch {
        /* ignore */
      }
      try {
        await supabase.from("profiles").delete().eq("id", userId);
      } catch {
        /* ignore */
      }
      try {
        await supabase.auth.admin.deleteUser(userId);
      } catch {
        /* ignore */
      }
    }

    return NextResponse.json({ deleted: ids.length });
  } catch (e) {
    console.error("Demo cleanup error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
