// IMPORTANT:
// All server routes must use the `admin` Supabase client.
// Do not use `supabase` in API routes.

/**
 * Hidden Feature Override: admin-only toggle for hidden features (preview).
 * GET: list flags with override state for current admin.
 * PATCH: set override (feature_flag_assignments for current user).
 * Admin/superadmin only. No production leakage.
 */

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
import { admin } from "@/lib/supabase-admin";
import { getCurrentUser, getCurrentUserProfile } from "@/lib/auth";
import { isAdmin } from "@/lib/roles";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const profile = await getCurrentUserProfile();
    const isAdminUser = isAdmin(profile?.role ?? null);
    if (!isAdminUser) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const [flagsRes, assignmentsRes] = await Promise.all([
      admin.from("feature_flags").select("id, name, key, description, is_globally_enabled, visibility_type").order("name"),
      admin.from("feature_flag_assignments").select("feature_flag_id, enabled").eq("user_id", user.id),
    ]);
    if (flagsRes.error) return NextResponse.json({ error: flagsRes.error.message }, { status: 500 });
    const assignments = (assignmentsRes.data ?? []) as { feature_flag_id: string; enabled: boolean }[];
    const overrideMap = new Map(assignments.map((a) => [a.feature_flag_id, a.enabled]));
    const flags = (flagsRes.data ?? []).map((f: { id: string; name: string; key: string; description: string | null; is_globally_enabled: boolean; visibility_type: string }) => ({
      id: f.id,
      name: f.name,
      key: f.key,
      description: f.description,
      isGloballyEnabled: f.is_globally_enabled,
      visibilityType: f.visibility_type,
      overrideEnabled: overrideMap.get(f.id) ?? null,
    }));
    return NextResponse.json({ flags });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const profile = await getCurrentUserProfile();
    const isAdminUser = isAdmin(profile?.role ?? null);
    if (!isAdminUser) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const featureFlagId = body.featureFlagId as string;
    const enabled = Boolean(body.enabled);
    if (!featureFlagId) return NextResponse.json({ error: "featureFlagId required" }, { status: 400 });
    const { data: existing } = await admin
      .from("feature_flag_assignments")
      .select("id")
      .eq("feature_flag_id", featureFlagId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (existing?.id) {
      const { error: updErr } = await admin
        .from("feature_flag_assignments")
        .update({ enabled, updated_at: new Date().toISOString() })
        .eq("id", existing.id);
      if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });
    } else {
      const { error: insErr } = await admin.from("feature_flag_assignments").insert({
        feature_flag_id: featureFlagId,
        user_id: user.id,
        enabled,
      });
      if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, featureFlagId, enabled });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
