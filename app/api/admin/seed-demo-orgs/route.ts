/**
 * POST /api/admin/seed-demo-orgs
 * Re-seed demo organizations. SANDBOX MODE only; super_admin only.
 * Demo orgs: mode = sandbox, demo = true. Never run in production.
 */

import { NextResponse } from "next/server";
import { requireSuperAdminForApi } from "@/lib/admin/requireAdmin";
import { adminForbiddenResponse } from "@/lib/admin/getAdminContext";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { APP_MODE } from "@/lib/app-mode";

export const dynamic = "force-dynamic";

const DEMO_ORGS = [
  { name: "Demo Healthcare Corp", slug: "demo-healthcare-corp", industry: "Healthcare" },
  { name: "Demo Retail Group", slug: "demo-retail-group", industry: "Retail" },
  { name: "Demo Security & Safety", slug: "demo-security-safety", industry: "Security" },
];

export async function POST() {
  if (APP_MODE !== "sandbox") {
    return NextResponse.json(
      { error: "Demo orgs may only be seeded in sandbox mode" },
      { status: 403 }
    );
  }
  const _session = await requireSuperAdminForApi();
  if (!_session) return adminForbiddenResponse();

  const supabase = getSupabaseServer() as any;

  const existing = await supabase
    .from("organizations")
    .select("id")
    .eq("mode", "sandbox")
    .eq("demo", true);
  const toDelete = (existing.data ?? []) as { id: string }[];
  for (const row of toDelete) {
    await supabase.from("organizations").delete().eq("id", row.id);
  }

  const created: { id: string; name: string; slug: string }[] = [];

  for (const org of DEMO_ORGS) {
    const { data: orgRow, error: orgErr } = await supabase
      .from("organizations")
      .insert({
        name: org.name,
        slug: org.slug,
        billing_tier: "starter",
        plan_type: "starter",
        number_of_locations: 1,
        requires_enterprise: false,
        mode: "sandbox",
        demo: true,
      })
      .select("id, name, slug")
      .single();

    if (orgErr || !orgRow) {
      console.error("[seed-demo-orgs] org insert error:", orgErr);
      continue;
    }
    created.push(orgRow as { id: string; name: string; slug: string });

    const locSlug = `${org.slug}-hq`;
    const { data: locRow, error: locErr } = await supabase
      .from("locations")
      .insert({
        organization_id: (orgRow as { id: string }).id,
        name: `${org.name} HQ`,
        slug: locSlug,
        city: "Demo City",
        state: "DC",
      })
      .select("id")
      .single();

    if (locErr || !locRow) {
      continue;
    }
  }

  return NextResponse.json({
    success: true,
    message: "Demo orgs seeded (sandbox only)",
    created: created.length,
    orgs: created,
  });
}
