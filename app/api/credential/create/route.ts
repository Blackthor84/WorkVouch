// IMPORTANT:
// All server routes must use the `admin` Supabase client.
// Do not use `supabase` in API routes.

/**
 * POST /api/credential/create
 * Create a WorkVouch Credential for the current user. Returns share_token and share URL.
 * Auth required. Payload includes verified employment, trust trajectory, reference credibility, verification coverage.
 */

import { NextRequest, NextResponse } from "next/server";
import { getEffectiveUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
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

export async function POST(req: NextRequest) {
  const effective = await getEffectiveUser();
  if (!effective?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let visibility: CredentialVisibility = "standard";
  let expiresInDays = 30;
  try {
    const body = await req.json().catch(() => ({}));
    if (body.visibility && ["minimal", "standard", "full"].includes(body.visibility)) visibility = body.visibility;
    if (typeof body.expiresInDays === "number" && body.expiresInDays > 0) expiresInDays = Math.min(90, Math.max(1, body.expiresInDays));
  } catch {
    // defaults
  }
  const supabase = await createClient();

  const { data: employmentRecords } = await admin
    .from("employment_records")
    .select("company_name, job_title, start_date, end_date, is_current, verification_status")
    .eq("user_id", effective.id);
  const records = (employmentRecords ?? []) as {
    company_name: string;
    job_title: string;
    start_date: string;
    end_date: string | null;
    is_current: boolean;
    verification_status: string;
  }[];

  const totalRoles = records.length;
  const verifiedRoles = records.filter((r) => r.verification_status === "verified").length;
  const verificationCoveragePct = totalRoles > 0 ? Math.round((verifiedRoles / totalRoles) * 100) : 0;

  const { data: trustRow } = await admin.from("trust_scores").select("score, reference_count").eq("user_id", effective.id).maybeSingle();
  const { data: profileRow } = await admin.from("profiles").select("industry").eq("id", effective.id).maybeSingle();
  const industry = (profileRow as { industry?: string } | null)?.industry ?? null;

  let trustBand: string | undefined;
  let trustTrajectory: string | undefined;
  let trustTrajectoryLabel: string | undefined;
  try {
    const [auditResult, trajectoryPayload] = await Promise.all([
      calculateEmployeeAuditScore(effective.id),
      getTrustTrajectory(effective.id),
    ]);
    trustBand = getAuditLabel(auditResult.band);
    trustTrajectory = trajectoryPayload.trajectory;
    trustTrajectoryLabel = trajectoryPayload.label;
  } catch {
    // optional
  }

  let referenceCredibility;
  try {
    referenceCredibility = await getReferenceCredibilitySummary(admin, effective.id);
  } catch {
    referenceCredibility = {
      referenceCount: 0,
      directManagerCount: 0,
      repeatedCoworkerCount: 0,
      verifiedMatchCount: 0,
    };
  }

  const payload = buildCredentialPayload({
    candidateId: effective.id,
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

  const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString();
  const shareToken = generateShareToken();

  const { data: inserted, error } = await admin.from("workvouch_credentials")
    .insert({
      candidate_id: effective.id,
      payload,
      visibility,
      share_token: shareToken,
      expires_at: expiresAt,
    })
    .select("id, share_token, expires_at, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { emitTrustEvent } = await import("@/lib/trust/eventEngine");
  await emitTrustEvent({
    profile_id: effective.id,
    event_type: "credential_issued",
    event_source: "credential_sharing",
    impact_score: 2,
    metadata: { credential_id: (inserted as { id: string }).id },
  }).catch(() => {});

  const base = process.env.NEXT_PUBLIC_APP_URL ?? (typeof window !== "undefined" ? window.location.origin : "");
  const shareUrl = `${base}/c/${encodeURIComponent((inserted as { share_token: string }).share_token)}`;

  return NextResponse.json({
    id: (inserted as { id: string }).id,
    profile_id: effective.id,
    share_token: (inserted as { share_token: string }).share_token,
    share_url: shareUrl,
    expires_at: (inserted as { expires_at: string }).expires_at,
    created_at: (inserted as { created_at: string }).created_at,
    read_only: true,
  });
}
