import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { requireAdminForApi } from "@/lib/auth/requireAdminForApi";
import { adminForbiddenResponse } from "@/lib/api/adminResponses";
import { insertAdminAuditLog } from "@/lib/admin/audit";
import { getAuditRequestMeta } from "@/lib/admin/getAuditRequestMeta";
import { buildProductionProfileInput } from "@/lib/core/intelligence/adapters/production";
import { calculateProfileStrength } from "@/lib/core/intelligence";

export const dynamic = "force-dynamic";

/** POST: run calculateProfileStrength("v1") for the user and persist. */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdminForApi();
  if (!admin) return adminForbiddenResponse();
  try {
    const { id: targetUserId } = await params;
    if (!targetUserId) {
      return NextResponse.json({ success: false, error: "Missing user id" }, { status: 400 });
    }

    const supabase = getSupabaseServer();
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", targetUserId)
      .single();

    if (!profile) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    const input = await buildProductionProfileInput(targetUserId);
    const profileStrength = calculateProfileStrength("v1", input);

    const { data: existing } = await supabase
      .from("intelligence_snapshots")
      .select("profile_strength")
      .eq("user_id", targetUserId)
      .maybeSingle();

    const oldStrength = (existing as { profile_strength?: number } | null)?.profile_strength ?? null;

    const { error: upsertError } = await supabase
      .from("intelligence_snapshots")
      .upsert(
        {
          user_id: targetUserId,
          profile_strength: profileStrength,
          career_health_score: profileStrength,
          tenure_score: 0,
          reference_score: 0,
          rehire_score: 0,
          dispute_score: 0,
          network_density_score: 0,
          last_calculated_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

    if (upsertError) {
      return NextResponse.json({ success: false, error: upsertError.message }, { status: 500 });
    }

    const { ipAddress, userAgent } = getAuditRequestMeta(_req);
    await insertAdminAuditLog({
      adminId: admin.userId,
      targetUserId,
      action: "recalculate",
      oldValue: oldStrength != null ? { profile_strength: oldStrength } : null,
      newValue: { profile_strength: profileStrength },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, profile_strength: profileStrength });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Internal error";
    if (msg === "Unauthorized") return NextResponse.json({ success: false, error: msg }, { status: 401 });
    if (msg === "Forbidden") return NextResponse.json({ success: false, error: msg }, { status: 403 });
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
