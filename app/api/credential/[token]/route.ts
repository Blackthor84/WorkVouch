/**
 * GET /api/credential/[token]
 * Public, read-only. Returns credential by share token.
 * No auth. Shows verified employment, trust trajectory, reference credibility, verification coverage.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export type CredentialPublicPayload = {
  version: number;
  issuedAt: string;
  workHistory: Array<{
    companyName: string;
    jobTitle: string;
    startDate: string;
    endDate: string | null;
    isCurrent: boolean;
    verificationStatus: string;
  }>;
  trustScore: number;
  confidenceScore: number;
  industry?: string;
  verifiedEmploymentSummary?: { totalRoles: number; verifiedRoles: number; verificationCoveragePct: number };
  trustBand?: string;
  trustTrajectory?: string;
  trustTrajectoryLabel?: string;
  verificationCoveragePct?: number;
  referenceCredibility?: {
    referenceCount: number;
    directManagerCount: number;
    repeatedCoworkerCount: number;
    verifiedMatchCount: number;
  };
};

export type CredentialGetResponse = {
  credential: {
    id: string;
    profile_id: string | null;
    payload: CredentialPublicPayload;
    visibility: string;
    issued_at: string;
    expires_at: string | null;
  };
  read_only: true;
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  if (!token || token.length < 10) {
    return NextResponse.json({ error: "Invalid or missing token" }, { status: 400 });
  }

  const admin = getSupabaseServer();
  const { data: cred, error } = await admin
    .from("workvouch_credentials")
    .select("id, candidate_id, profile_id, payload, visibility, issued_at, expires_at, revoked_at")
    .eq("share_token", token)
    .is("revoked_at", null)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: "Credential unavailable" }, { status: 500 });
  }
  if (!cred) {
    return NextResponse.json({ error: "Credential not found or revoked" }, { status: 404 });
  }

  const c = cred as { expires_at: string | null; payload: CredentialPublicPayload };
  if (c.expires_at && new Date(c.expires_at) < new Date()) {
    return NextResponse.json({ error: "Credential link has expired" }, { status: 410 });
  }

  await admin.from("credential_views_audit").insert({
    workvouch_credential_id: (cred as { id: string }).id,
    viewer_id: null,
    viewer_employer_id: null,
    context: "link",
    job_application_id: null,
  });

  const out = cred as {
    id: string;
    candidate_id: string;
    profile_id: string | null;
    payload: CredentialPublicPayload;
    visibility: string;
    issued_at: string;
    expires_at: string | null;
  };

  return NextResponse.json({
    credential: {
      id: out.id,
      profile_id: out.profile_id ?? out.candidate_id,
      payload: out.payload,
      visibility: out.visibility,
      issued_at: out.issued_at,
      expires_at: out.expires_at,
    },
    read_only: true,
  } satisfies CredentialGetResponse);
}
