// IMPORTANT:
// All server routes must use the `admin` Supabase client.
// Do not use `supabase` in API routes.

/**
 * POST /api/user/workvouch-credential — Issue a WorkVouch Credential (candidate).
 * GET /api/user/workvouch-credential — List own credentials.
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { admin } from "@/lib/supabase-admin";
import { buildCredentialPayload } from "@/lib/workvouch-credential/core";
import type { CredentialVisibility } from "@/lib/workvouch-credential/types";
import { getReferenceCredibilitySummary } from "@/lib/workvouch-credential/referenceCredibility";
import { calculateEmployeeAuditScore, getAuditLabel } from "@/lib/scoring/employeeAuditScore";
import { getTrustTrajectory } from "@/lib/trust/trustTrajectory";
import { randomBytes } from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function generateShareToken(): string {
  return randomBytes(24).toString("base64url");
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      console.warn("[AUTH]", { route: "/api/user/workvouch-credential", reason: "unauthenticated" });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createServerSupabaseClient();
    const { data: rows, error } = await admin.from("workvouch_credentials")
      .select("id, candidate_id, payload, visibility, share_token, issued_at, expires_at, revoked_at, created_at, updated_at")
      .eq("candidate_id", user.id)
      .order("issued_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("[API ERROR]", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ credentials: rows ?? [] });
  } catch (e) {
    console.error("[API ERROR]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      console.warn("[AUTH]", { route: "POST /api/user/workvouch-credential", reason: "unauthenticated" });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let visibility: CredentialVisibility = "standard";
    let expiresInDays: number | null = null;
    let includeShareToken = false;
    try {
      const body = await req.json().catch(() => ({}));
      if (body.visibility && ["minimal", "standard", "full"].includes(body.visibility)) visibility = body.visibility;
      if (typeof body.expiresInDays === "number" && body.expiresInDays > 0) expiresInDays = body.expiresInDays;
      if (typeof body.includeShareToken === "boolean") includeShareToken = body.includeShareToken;
    } catch {
      // use defaults
    }

    // Share links must be time-limited (1–90 days); default 30 when share token requested
    if (includeShareToken) {
      if (expiresInDays == null) expiresInDays = 30;
      expiresInDays = Math.max(1, Math.min(90, expiresInDays));
    }

    const supabase = await createServerSupabaseClient();
    // Use admin to read employment_records (candidate may be in different RLS context)
    const { data: employmentRecords } = await admin
      .from("employment_records")
      .select("company_name, job_title, start_date, end_date, is_current, verification_status")
      .eq("user_id", user.id);
    const records = (employmentRecords ?? []) as { company_name: string; job_title: string; start_date: string; end_date: string | null; is_current: boolean; verification_status: string }[];

    const totalRoles = records.length;
    const verifiedRoles = records.filter((r) => r.verification_status === "verified").length;
    const verificationCoveragePct = totalRoles > 0 ? Math.round((verifiedRoles / totalRoles) * 100) : 0;

    const { data: trustRow } = await admin
      .from("trust_scores")
      .select("score, reference_count")
      .eq("user_id", user.id)
      .maybeSingle();

    const { data: profileRow } = await admin
      .from("profiles")
      .select("industry")
      .eq("id", user.id)
      .maybeSingle();
    const industry = (profileRow as { industry?: string } | null)?.industry ?? null;

    let trustBand: string | undefined;
    let trustTrajectory: string | undefined;
    let trustTrajectoryLabel: string | undefined;
    try {
      const [auditResult, trajectoryPayload] = await Promise.all([
        calculateEmployeeAuditScore(user.id),
        getTrustTrajectory(user.id),
      ]);
      trustBand = getAuditLabel(auditResult.band);
      trustTrajectory = trajectoryPayload.trajectory;
      trustTrajectoryLabel = trajectoryPayload.label;
    } catch {
      // optional: credential still valid without band/trajectory
    }

    let referenceCredibility;
    try {
      referenceCredibility = await getReferenceCredibilitySummary(admin, user.id);
    } catch {
      referenceCredibility = { referenceCount: 0, directManagerCount: 0, repeatedCoworkerCount: 0, verifiedMatchCount: 0 };
    }

    const payload = buildCredentialPayload({
      candidateId: user.id,
      employmentRecords: records,
      trustScoreRow: trustRow ?? null,
      industry,
      verifiedEmploymentSummary: totalRoles > 0 ? { totalRoles, verifiedRoles, verificationCoveragePct } : undefined,
      trustBand,
      trustTrajectory,
      trustTrajectoryLabel,
      verificationCoveragePct,
      referenceCredibility,
    });

    const expiresAt = expiresInDays
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
      : null;
    const shareToken = includeShareToken ? generateShareToken() : null;

    const { data: inserted, error } = await admin.from("workvouch_credentials")
      .insert({
        candidate_id: user.id,
        payload,
        visibility,
        share_token: shareToken,
        expires_at: expiresAt,
      })
      .select("id, share_token, issued_at, expires_at, created_at")
      .single();

    if (error) {
      console.error("[API ERROR]", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      id: (inserted as { id: string }).id,
      share_token: (inserted as { share_token: string | null }).share_token,
      issued_at: (inserted as { issued_at: string }).issued_at,
      expires_at: (inserted as { expires_at: string | null }).expires_at,
      created_at: (inserted as { created_at: string }).created_at,
    });
  } catch (e) {
    console.error("[API ERROR]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
