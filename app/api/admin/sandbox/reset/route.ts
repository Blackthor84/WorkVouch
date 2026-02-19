import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
import { getAdminContext, adminForbiddenResponse } from "@/lib/admin/getAdminContext";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { requireSandboxEnvironment } from "@/lib/server/requireSandboxEnvironment";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const envCheck = requireSandboxEnvironment();
  if (!envCheck.allowed) return envCheck.response;
  const admin = await getAdminContext(req);
  if (!admin.isAdmin) return adminForbiddenResponse();
  try {
    const body = (await req.json().catch(() => ({}))) as { orgId?: string; scope?: string };
    const orgId = body.orgId;
    const scope = body.scope ?? "usage";
    if (!orgId || typeof orgId !== "string") return NextResponse.json({ success: false, error: "orgId required" }, { status: 400 });
    const supabase = getSupabaseServer();
    const { data: org } = await supabase.from("organizations").select("id, mode").eq("id", orgId).single();
    if (!org || (org as { mode?: string }).mode !== "sandbox") return NextResponse.json({ success: false, error: "Sandbox org not found" }, { status: 404 });
    if (scope === "usage") {
      const month = new Date().toISOString().slice(0, 7);
      await supabase.from("organization_usage").delete().eq("organization_id", orgId).eq("month", month);
    }
    return NextResponse.json({ success: true, message: "Sandbox reset" });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Internal error" }, { status: 500 });
  }
}
