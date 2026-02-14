/**
 * POST /api/admin/sandbox/clone-org
 * Sandbox-only. Clone a production org into sandbox (structure only). Requires admin.isSandbox. Production returns 403.
 */

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
import { getAdminContext, adminForbiddenResponse } from "@/lib/admin/getAdminContext";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { APP_MODE } from "@/lib/app-mode";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const admin = await getAdminContext();
  if (APP_MODE !== "sandbox" || !admin.isSandbox) return adminForbiddenResponse();

  try {
    const body = await req.json().catch(() => ({})) as { sourceOrgId?: string; organizationId?: string; name?: string };
    const sourceOrgId = body.sourceOrgId ?? body.organizationId;
    const name = body.name ?? "Cloned Sandbox Org";

    if (!sourceOrgId || typeof sourceOrgId !== "string") {
      return NextResponse.json({ success: false, error: "sourceOrgId required" }, { status: 400 });
    }

    const supabase = getSupabaseServer();
    const { data: source } = await supabase
      .from("organizations")
      .select("id, name, plan_type, number_of_locations")
      .eq("id", sourceOrgId)
      .single();

    if (!source) {
      return NextResponse.json({ success: false, error: "Source org not found" }, { status: 404 });
    }

    const slug = "sandbox-clone-" + sourceOrgId.slice(0, 8) + "-" + Date.now();
    const { data: newOrg, error: orgErr } = await supabase
      .from("organizations")
      .insert({
        name,
        slug,
        billing_tier: (source as { plan_type?: string }).plan_type ?? "starter",
        plan_type: (source as { plan_type?: string }).plan_type ?? "starter",
        number_of_locations: (source as { number_of_locations?: number }).number_of_locations ?? 1,
        requires_enterprise: false,
        mode: "sandbox",
        demo: true,
      })
      .select("id, name, slug")
      .single();

    if (orgErr || !newOrg) {
      return NextResponse.json({ success: false, error: orgErr?.message ?? "Failed to create org" }, { status: 500 });
    }

    const { data: locs } = await supabase.from("locations").select("id, name, slug, city, state").eq("organization_id", sourceOrgId);
    for (const loc of (locs ?? []) as { name: string; slug: string; city: string; state: string }[]) {
      await supabase.from("locations").insert({
        organization_id: (newOrg as { id: string }).id,
        name: loc.name,
        slug: loc.slug + "-clone-" + Date.now(),
        city: loc.city ?? "Demo City",
        state: loc.state ?? "DC",
      });
    }

    return NextResponse.json({
      success: true,
      message: "Org cloned into sandbox (structure only)",
      org: newOrg,
      locationsCloned: (locs ?? []).length,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Internal error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
