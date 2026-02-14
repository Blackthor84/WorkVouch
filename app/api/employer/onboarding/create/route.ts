/**
 * POST /api/employer/onboarding/create
 * First employer onboarding: create org, org_admin mapping, employer role.
 * No demo data, no sandbox logic. Must be authenticated.
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function slugFromName(name: string): string {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
  return base || "org";
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user?.id || !user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const orgName = typeof body.orgName === "string" ? body.orgName.trim() : "";
    const industry = typeof body.industry === "string" ? body.industry.trim() : "";
    const orgSize = typeof body.orgSize === "string" ? body.orgSize.trim() : "";
    const primaryAdminEmail = typeof body.primaryAdminEmail === "string" ? body.primaryAdminEmail.trim() : "";

    if (!orgName || orgName.length < 2) {
      return NextResponse.json({ error: "Organization name is required (min 2 characters)" }, { status: 400 });
    }
    if (!industry) {
      return NextResponse.json({ error: "Industry is required" }, { status: 400 });
    }
    if (!orgSize) {
      return NextResponse.json({ error: "Organization size is required" }, { status: 400 });
    }
    if (primaryAdminEmail.toLowerCase() !== (user.email ?? "").toLowerCase()) {
      return NextResponse.json({ error: "Primary admin email must match your account" }, { status: 400 });
    }

    const supabase = await createServerSupabase();
    const supabaseAny = supabase as any;

    const baseSlug = slugFromName(orgName);
    let slug = baseSlug;
    let suffix = 0;
    while (true) {
      const { data: existing } = await supabaseAny
        .from("organizations")
        .select("id")
        .eq("slug", slug)
        .limit(1)
        .maybeSingle();
      if (!existing) break;
      suffix += 1;
      slug = `${baseSlug}-${suffix}`;
    }

    const { data: org, error: orgError } = await supabaseAny
      .from("organizations")
      .insert({
        name: orgName,
        slug,
        billing_tier: "starter",
        plan_type: "starter",
        number_of_locations: orgSize === "1" ? 1 : orgSize === "2-10" ? 5 : orgSize === "11-50" ? 25 : 100,
        requires_enterprise: false,
        mode: "production",
      })
      .select("id")
      .single();

    if (orgError || !org) {
      console.error("[employer/onboarding] org insert error:", orgError);
      return NextResponse.json({ error: "Failed to create organization" }, { status: 500 });
    }

    const orgId = (org as { id: string }).id;

    const { error: membershipError } = await supabaseAny.from("tenant_memberships").insert({
      user_id: user.id,
      organization_id: orgId,
      location_id: null,
      role: "enterprise_owner",
    });

    if (membershipError) {
      console.error("[employer/onboarding] tenant_memberships insert error:", membershipError);
      await supabaseAny.from("organizations").delete().eq("id", orgId);
      return NextResponse.json({ error: "Failed to create org admin mapping" }, { status: 500 });
    }

    const { error: profileError } = await supabaseAny
      .from("profiles")
      .update({ role: "employer" })
      .eq("id", user.id);

    if (profileError) {
      console.error("[employer/onboarding] profile update error:", profileError);
    }

    const { data: existingRole } = await supabaseAny
      .from("user_roles")
      .select("id")
      .eq("user_id", user.id)
      .eq("role", "employer")
      .maybeSingle();
    if (!existingRole) {
      await supabaseAny.from("user_roles").insert({ user_id: user.id, role: "employer" });
    }

    const industryType = industry.toLowerCase().replace(/\s+/g, "_").replace(/-/g, "_");
    const { error: employerError } = await supabaseAny.from("employer_accounts").insert({
      user_id: user.id,
      company_name: orgName,
      industry_type: industryType || null,
      plan_tier: "free",
    });

    if (employerError) {
      console.error("[employer/onboarding] employer_accounts insert error:", employerError);
    }

    try {
      await supabaseAny.from("employer_users").insert({
        organization_id: orgId,
        location_id: null,
        profile_id: user.id,
        role: "org_admin",
      });
    } catch {
      // employer_users may not exist or RLS may block; non-fatal
    }

    return NextResponse.json({
      success: true,
      organizationId: orgId,
      redirect: "/employer/dashboard?welcome=1",
    });
  } catch (e) {
    console.error("[employer/onboarding] error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
