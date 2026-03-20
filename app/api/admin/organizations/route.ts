export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";

import { isSandboxRequest } from "@/lib/sandboxRequest";
import { requireSuperAdminApi } from "@/lib/admin/requireSuperAdminApi";
import { admin } from "@/lib/supabase-admin";

/**
 * GET /api/admin/organizations
 * List organizations (super_admin only).
 * Production admin only sees production, non-demo orgs; sandbox requests see all.
 */
export async function GET(req: NextRequest) {
  const auth = await requireSuperAdminApi();
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim();

    let query = admin
      .from("organizations")
      .select("id, slug, name, created_at, updated_at, billing_tier, demo, mode")
      .order("created_at", { ascending: false });

    if (search) {
      const safe = search.replace(/%/g, "\\%").replace(/_/g, "\\_");
      query = query.or(`name.ilike.%${safe}%,slug.ilike.%${safe}%`);
    }

    if (!isSandboxRequest(req)) {
      query = query.eq("mode", "production").eq("demo", false);
    }

    const { data, error } = await query;

    if (error) {
      console.warn("[admin/organizations] query error:", error.message);
      return NextResponse.json({ organizations: [] });
    }

    const organizations =
      (data ?? []).map((o) => ({
        id: o.id,
        slug: o.slug,
        name: o.name ?? o.slug ?? "Unnamed",
        created_at: o.created_at,
        updated_at: o.updated_at,
        billing_tier: o.billing_tier,
        demo: Boolean(o.demo),
        mode: o.mode ?? "production",
      })) ?? [];

    return NextResponse.json({ organizations });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.warn("[admin/organizations] failed:", msg);
    return NextResponse.json({ organizations: [] });
  }
}
