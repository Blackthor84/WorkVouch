import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { requireAdminForApi, assertAdminCanModify } from "@/lib/auth/requireAdminForApi";
import { adminForbiddenResponse } from "@/lib/api/adminResponses";
import { insertAdminAuditLog } from "@/lib/admin/audit";
import { getAuditRequestMeta } from "@/lib/admin/getAuditRequestMeta";
import { getAdminContext } from "@/lib/admin/getAdminContext";
import { applyScenario } from "@/lib/impersonation/scenarioResolver";

export const dynamic = "force-dynamic";

/** GET: fetch single user for admin detail page (profile + role + profile_strength). */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const _session = await requireAdminForApi();
  if (!_session) return adminForbiddenResponse();
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Missing user id" }, { status: 400 });
    }
    const supabase = getSupabaseServer();
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, full_name, email, role, industry, status, risk_level, flagged_for_fraud, deleted_at, created_at")
      .eq("id", id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const profileRole = (profile as { role?: string }).role;
    const roles = profileRole ? [profileRole] : [];

    const { data: snapshot } = await supabase
      .from("intelligence_snapshots")
      .select("profile_strength")
      .eq("user_id", id)
      .is("is_simulation", null)
      .maybeSingle();
    const profileStrength = (snapshot as { profile_strength?: number } | null)?.profile_strength ?? null;

    const baseData = { ...profile, roles, profile_strength: profileStrength };
    const admin = await getAdminContext(req);
    return NextResponse.json(applyScenario(baseData, admin.impersonation));
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Internal error";
    if (msg === "Unauthorized") return NextResponse.json({ error: msg }, { status: 401 });
    if (msg === "Forbidden") return NextResponse.json({ error: msg }, { status: 403 });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/** PATCH: update user profile (role, status, risk_level, full_name, industry, etc.) */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdminForApi();
  if (!admin) return adminForbiddenResponse();
  try {
    const { id: targetUserId } = await params;
    if (!targetUserId) {
      return NextResponse.json({ success: false, error: "Missing user id" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({})) as {
      full_name?: string;
      role?: string;
      status?: "active" | "suspended" | "deleted";
      risk_level?: "low" | "medium" | "high";
      flagged_for_fraud?: boolean;
      industry?: string;
      stripe_customer_id?: string | null;
      stripe_subscription_id?: string | null;
    };

    const supabase = getSupabaseServer();
    const { data: oldRow } = await supabase
      .from("profiles")
      .select("full_name, role, status, risk_level, flagged_for_fraud, industry")
      .eq("id", targetUserId)
      .single();

    if (!oldRow) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    const targetRole = (oldRow as { role?: string }).role ?? "user";
    assertAdminCanModify(admin, targetUserId, targetRole, body.role);

    // Only superadmin can edit Stripe IDs
    if ((body.stripe_customer_id !== undefined || body.stripe_subscription_id !== undefined) && !admin.isSuperAdmin) {
      return NextResponse.json({ success: false, error: "Forbidden: Only superadmin can edit Stripe IDs" }, { status: 403 });
    }

    const updates: Record<string, unknown> = {};
    if (body.full_name !== undefined) updates.full_name = body.full_name;
    if (body.role !== undefined) updates.role = body.role;
    if (body.status !== undefined) updates.status = body.status;
    if (body.risk_level !== undefined) updates.risk_level = body.risk_level;
    if (body.flagged_for_fraud !== undefined) updates.flagged_for_fraud = body.flagged_for_fraud;
    if (body.industry !== undefined) updates.industry = body.industry;
    if (admin.isSuperAdmin && body.stripe_customer_id !== undefined) updates.stripe_customer_id = body.stripe_customer_id;
    if (admin.isSuperAdmin && body.stripe_subscription_id !== undefined) updates.stripe_subscription_id = body.stripe_subscription_id;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ success: true });
    }

    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", targetUserId);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const { ipAddress, userAgent } = getAuditRequestMeta(req);
    await insertAdminAuditLog({
      adminId: admin.authUserId,
      targetUserId,
      action: "profile_update",
      oldValue: oldRow as Record<string, unknown>,
      newValue: { ...oldRow, ...updates } as Record<string, unknown>,
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Internal error";
    if (msg === "Unauthorized") return NextResponse.json({ success: false, error: msg }, { status: 401 });
    if (msg === "Forbidden") return NextResponse.json({ success: false, error: msg }, { status: 403 });
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
