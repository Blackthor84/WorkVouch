// IMPORTANT:
// All server routes must use the `admin` Supabase client.
// Do not use `supabase` in API routes.

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
import { getAdminContext } from "@/lib/admin/getAdminContext";
import { adminForbiddenResponse } from "@/lib/api/adminResponses";
import { admin } from "@/lib/supabase-admin";
import { requireSandboxOrOverrideEnvironment } from "@/lib/server/requireSandboxOrOverride";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const envCheck = await requireSandboxOrOverrideEnvironment();
  if (!envCheck.allowed) return envCheck.response;
  const adminContext = await getAdminContext(req);
  if (!adminContext.isAdmin || !adminContext.canSeedData) return adminForbiddenResponse();
  try {
    const body = (await req.json().catch(() => ({}))) as { type?: string };
    const type = body.type ?? "demo_org";
    if (type === "demo_org") {
      const slug = "sandbox-demo-" + String(Date.now());
      const { data: org } = await admin.from("organizations").insert({ name: "Sandbox Demo Org", slug, billing_tier: "starter", plan_type: "starter", number_of_locations: 1, requires_enterprise: false, mode: "sandbox", demo: true }).select("id, name, slug").single();
      if (org) await admin.from("locations").insert({ organization_id: (org as { id: string }).id, name: "HQ", slug: slug + "-hq", city: "Demo City", state: "DC" });
      return NextResponse.json({ success: true, message: "Demo org seeded", org });
    }
    return NextResponse.json({ success: false, error: "Unknown seed type" }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Internal error" }, { status: 500 });
  }
}
