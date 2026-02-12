import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { requireEnterpriseOwner } from "@/lib/enterprise/requireEnterprise";
import { checkOrgLimits } from "@/lib/enterprise/enforceOrgLimits";

/**
 * GET /api/enterprise/organizations/[orgId]/locations
 * List locations for an organization (enterprise owner or platform admin).
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const { orgId } = await params;
    await requireEnterpriseOwner(orgId);
    const supabase = getSupabaseServer();
    const { data, error } = await supabase
      .from("locations")
      .select("id, organization_id, name, slug, created_at, updated_at")
      .eq("organization_id", orgId)
      .order("name");

    if (error) {
      console.error("[ENTERPRISE_LOCATIONS_GET]", error);
      return NextResponse.json(
        { success: false, error: "Failed to load locations" },
        { status: 500 }
      );
    }
    return NextResponse.json({ success: true, locations: data ?? [] });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unauthorized";
    if (msg === "Unauthorized")
      return NextResponse.json({ success: false, error: msg }, { status: 401 });
    if (msg.startsWith("Forbidden"))
      return NextResponse.json({ success: false, error: msg }, { status: 403 });
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/enterprise/organizations/[orgId]/locations
 * Create a new location (sub-account). Enterprise owner only.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const { orgId } = await params;
    await requireEnterpriseOwner(orgId);
    const body = await req.json().catch(() => ({}));
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const slug = typeof body.slug === "string" ? body.slug.trim().toLowerCase().replace(/\s+/g, "-") : "";

    if (!name) {
      return NextResponse.json(
        { success: false, error: "Name is required" },
        { status: 400 }
      );
    }
    const finalSlug = slug || name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    if (!finalSlug) {
      return NextResponse.json(
        { success: false, error: "Valid slug is required" },
        { status: 400 }
      );
    }

    const orgLimit = await checkOrgLimits({ organizationId: orgId }, "add_location");
    if (!orgLimit.allowed) {
      return NextResponse.json(
        { success: false, error: orgLimit.error ?? "Location limit reached. Upgrade to add more locations.", requiresUpgrade: true },
        { status: 403 }
      );
    }

    const supabase = getSupabaseServer();
    const { data: existing } = await supabase
      .from("locations")
      .select("id")
      .eq("organization_id", orgId)
      .eq("slug", finalSlug)
      .maybeSingle();
    if (existing) {
      return NextResponse.json(
        { success: false, error: "A location with this slug already exists" },
        { status: 400 }
      );
    }

    const { data: inserted, error } = await supabase
      .from("locations")
      .insert({
        organization_id: orgId,
        name,
        slug: finalSlug,
      })
      .select("id, organization_id, name, slug, created_at, updated_at")
      .single();

    if (error) {
      console.error("[ENTERPRISE_LOCATIONS_POST]", error);
      return NextResponse.json(
        { success: false, error: "Failed to create location" },
        { status: 500 }
      );
    }
    const { count } = await supabase.from("locations").select("id", { count: "exact", head: true }).eq("organization_id", orgId);
    if (typeof count === "number") {
      await (supabase as any).from("organizations").update({ number_of_locations: count }).eq("id", orgId);
    }
    return NextResponse.json({ success: true, location: inserted });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unauthorized";
    if (msg === "Unauthorized")
      return NextResponse.json({ success: false, error: msg }, { status: 401 });
    if (msg.startsWith("Forbidden"))
      return NextResponse.json({ success: false, error: msg }, { status: 403 });
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
