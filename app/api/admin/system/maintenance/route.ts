import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { requireAdminFromSupabase, requireSuperAdminFromSupabase } from "@/lib/auth/admin-role-guards";
import { adminForbiddenResponse } from "@/lib/admin/getAdminContext";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET: maintenance mode state — admin can read */
export async function GET() {
  const forbidden = await requireAdminFromSupabase();
  if (forbidden) return forbidden;
  try {
    const supabase = getSupabaseServer();
    const { data, error } = await supabase
      .from("system_settings")
      .select("value")
      .eq("key", "maintenance_mode")
      .maybeSingle();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ maintenance_mode: (data as { value?: unknown } | null)?.value ?? null });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Internal error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/** PATCH: set maintenance mode — superadmin only */
export async function PATCH(req: NextRequest) {
  const forbidden = await requireSuperAdminFromSupabase();
  if (forbidden) return forbidden;
  try {
    const body = await req.json().catch(() => ({})) as { enabled?: boolean; banner_message?: string };
    const supabase = getSupabaseServer();
    const { data: existing } = await supabase
      .from("system_settings")
      .select("value")
      .eq("key", "maintenance_mode")
      .maybeSingle();
    const current = (existing as { value?: { enabled?: boolean; banner_message?: string } } | null)?.value ?? {};
    const value = {
      ...current,
      enabled: body.enabled ?? current.enabled,
      banner_message: body.banner_message ?? current.banner_message,
    };
    const { error } = await supabase
      .from("system_settings")
      .upsert({ key: "maintenance_mode", value, updated_at: new Date().toISOString() }, { onConflict: "key" });
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, maintenance_mode: value });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Internal error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
