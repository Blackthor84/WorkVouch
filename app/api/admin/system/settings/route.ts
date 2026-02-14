import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { requireAdminForApi, requireSuperAdminForApi } from "@/lib/admin/requireAdmin";
import { adminForbiddenResponse } from "@/lib/admin/getAdminContext";

export const dynamic = "force-dynamic";

/** GET: system settings (maintenance mode, etc.) — admin can read */
export async function GET() {
  const _session = await requireAdminForApi();
  if (!_session) return adminForbiddenResponse();
  try {
    const supabase = getSupabaseServer();
    const { data, error } = await supabase.from("system_settings").select("key, value, updated_at").in("key", ["maintenance_mode", "intelligence_version"]);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    const map: Record<string, unknown> = {};
    for (const row of (data ?? []) as { key: string; value: unknown }[]) {
      map[row.key] = row.value;
    }
    return NextResponse.json(map);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Internal error";
    if (msg === "Unauthorized") return NextResponse.json({ error: msg }, { status: 401 });
    if (msg === "Forbidden") return NextResponse.json({ error: msg }, { status: 403 });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/** PATCH: update system settings — superadmin only */
export async function PATCH(req: NextRequest) {
  const admin = await requireSuperAdminForApi();
  if (!admin) return adminForbiddenResponse();
  try {
    const body = await req.json().catch(() => ({})) as { maintenance_mode?: { enabled?: boolean; block_signups?: boolean; block_reviews?: boolean; block_employment?: boolean; banner_message?: string } };
    const supabase = getSupabaseServer();
    if (body.maintenance_mode !== undefined) {
      const { error } = await supabase.from("system_settings").upsert({
        key: "maintenance_mode",
        value: body.maintenance_mode,
        updated_at: new Date().toISOString(),
        updated_by: admin.userId,
      }, { onConflict: "key" });
      if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Internal error";
    if (msg === "Unauthorized") return NextResponse.json({ error: msg }, { status: 401 });
    if (msg === "Forbidden" || msg.startsWith("Forbidden:")) return NextResponse.json({ success: false, error: msg }, { status: 403 });
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
