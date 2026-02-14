/**
 * POST /api/admin/add-employer-user
 * Add an employer user (admin) to an organization. Server-side limit enforcement before insert.
 * Admin/superadmin only.
 */

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
import { getCurrentUser, getCurrentUserRole } from "@/lib/auth";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { checkOrgLimits, planLimit403Response } from "@/lib/enterprise/checkOrgLimits";
import { getOrgHealthScore, updateOrgHealth } from "@/lib/enterprise/orgHealthScore";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    const authRole = await getCurrentUserRole();
    const isAdmin = authRole === "admin" || authRole === "superadmin";
    if (!isAdmin) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const organizationId = typeof body.organizationId === "string" ? body.organizationId.trim() : "";
    const profileId = typeof body.profileId === "string" ? body.profileId.trim() : "";
    const role = typeof body.role === "string" ? body.role.trim() : "org_admin";

    if (!organizationId || !profileId) {
      return NextResponse.json(
        { success: false, error: "organizationId and profileId are required" },
        { status: 400 }
      );
    }

    const limitCheck = await checkOrgLimits(organizationId, "add_admin");
    if (!limitCheck.allowed) {
      const health = await getOrgHealthScore(organizationId);
      return planLimit403Response(limitCheck, "add_admin", { status: health.status, recommended_plan: health.recommended_plan });
    }

    const supabase = getSupabaseServer();
    const { data: inserted, error } = await supabase
      .from("employer_users")
      .insert({
        organization_id: organizationId,
        profile_id: profileId,
        role,
      })
      .select("id, organization_id, profile_id, role, created_at")
      .single();

    if (error) {
      console.error("[admin/add-employer-user]", error);
      return NextResponse.json(
        { success: false, error: "Failed to add employer user" },
        { status: 500 }
      );
    }

    updateOrgHealth(organizationId).catch(() => {});
    return NextResponse.json({ success: true, employer_user: inserted });
  } catch (e) {
    console.error("[admin/add-employer-user]", e);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
