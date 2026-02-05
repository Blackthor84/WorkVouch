import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { requireSandboxV2Admin } from "@/lib/sandbox/adminAuth";

export const dynamic = "force-dynamic";
const sb = () => getSupabaseServer() as any;

/** GET /api/admin/sandbox-v2/templates — list sandbox_templates for dropdown */
export async function GET() {
  try {
    await requireSandboxV2Admin();
    const { data, error } = await sb()
      .from("sandbox_templates")
      .select("id, template_key, display_name, industry, default_employee_count, description")
      .order("display_name");
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ templates: data ?? [] });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error";
    if (msg === "Unauthorized") return NextResponse.json({ error: msg }, { status: 401 });
    if (msg.startsWith("Forbidden")) return NextResponse.json({ error: msg }, { status: 403 });
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
