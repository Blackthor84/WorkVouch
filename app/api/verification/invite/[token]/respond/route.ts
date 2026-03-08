// IMPORTANT:
// All server routes must use the `admin` Supabase client.
// Do not use `supabase` in API routes.

/**
 * POST /api/verification/invite/[token]/respond
 * Public: confirm or deny employment (invite link response).
 * Body: { action: "confirm" | "deny" }
 *
 * Security: invite expiration, same-company check, account-age protection,
 * duplicate verifier block, verification ring detection, IP tracking and suspicious-IP logging.
 */

import { NextRequest, NextResponse } from "next/server";
import { admin } from "@/lib/supabase-admin";
import type { Json } from "@/types/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const IMPACT_CONFIRM = 5;
const IMPACT_DENY = -10;
const ACCOUNT_AGE_HOURS_THRESHOLD = 24;
const SUSPICIOUS_IP_COUNT_THRESHOLD = 5;
const SUSPICIOUS_IP_WINDOW_HOURS = 1;

/** Capture client IP for abuse detection (same-IP bulk verification). */
function getClientIp(req: NextRequest): string | null {
  const v =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip")?.trim() ??
    null;
  return v || null;
}

/** Normalize company string for comparison (lowercase, trim). */
function normalizeCompany(s: string | null | undefined): string {
  if (s == null) return "";
  return String(s).trim().toLowerCase();
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  if (!token?.trim()) {
    return NextResponse.json({ error: "Token required" }, { status: 400 });
  }

  let body: { action?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const action =
    body.action === "confirm" || body.action === "deny" ? body.action : null;
  if (!action) {
    return NextResponse.json(
      { error: "action is required and must be confirm or deny" },
      { status: 400 }
    );
  }

  const clientIp = getClientIp(req);
  type InviteRow = { id: string; candidate_id: string; email: string; company: string | null; status: string; expires_at: string | null };
  const { data: invite, error: fetchError } = await admin
    .from("verification_invites")
    .select("id, candidate_id, email, company, status, expires_at")
    .eq("token", token.trim())
    .maybeSingle()
    .returns<InviteRow | null>();

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }
  if (!invite) {
    return NextResponse.json({ error: "Invite not found" }, { status: 404 });
  }
  if (invite.status !== "pending") {
    return NextResponse.json(
      { error: "Invite already responded to" },
      { status: 400 }
    );
  }

  // 1) Invite expiration: prevents use of old/stolen links.
  if (invite.expires_at) {
    const expiresAt = new Date(invite.expires_at as string).getTime();
    if (Date.now() > expiresAt) {
      return NextResponse.json(
        { error: "Verification link expired" },
        { status: 400 }
      );
    }
  }

  // 2) Verification ring – Rule 1: one verifier cannot verify the same candidate twice (prevents duplicate loops).
  if (action === "confirm") {
    type TrustEventRow = { id: string; payload: Json };
    const { data: existingEvents } = await admin
      .from("trust_events")
      .select("id, payload")
      .eq("profile_id", invite.candidate_id)
      .in("event_type", ["coworker_verified", "coworker_verification_confirmed"])
      .returns<TrustEventRow[]>();

    const alreadyVerified = (existingEvents ?? []).some((e) =>
      (e.payload as { verifier_id?: string } | null)?.verifier_id === invite.email
    );
    if (alreadyVerified) {
      return NextResponse.json(
        { error: "You have already verified this candidate" },
        { status: 400 }
      );
    }
  }

  // 3) Same-company check: candidate’s employment company vs invite company (fraud signal).
  let companyMismatch = false;
  if (action === "confirm" && invite.company) {
    type EmpRow = { company_name: string | null; company_normalized: string | null };
    const { data: empRows } = await admin
      .from("employment_records")
      .select("company_name, company_normalized")
      .eq("user_id", invite.candidate_id)
      .returns<EmpRow[]>();

    const inviteCompanyNorm = normalizeCompany(invite.company);
    const candidateCompanies = (empRows ?? []).map((r) =>
      normalizeCompany(r.company_normalized ?? r.company_name)
    );
    companyMismatch =
      inviteCompanyNorm.length > 0 &&
      candidateCompanies.length > 0 &&
      !candidateCompanies.some(
        (c: string) => c === inviteCompanyNorm || (c && inviteCompanyNorm && c.includes(inviteCompanyNorm)) || (inviteCompanyNorm && inviteCompanyNorm.includes(c))
      );
  }

  // 4) Account age protection: verifier account < 24h → do not increase trust score (impact_score = 0), log for monitoring.
  let impactScore = action === "confirm" ? IMPACT_CONFIRM : IMPACT_DENY;
  let verifierProfileId: string | null = null;
  let verifierAccountAgeHours: number | null = null;

  const { data: verifierProfile } = await admin
    .from("profiles")
    .select("id, created_at")
    .eq("email", invite.email)
    .maybeSingle();

  if (verifierProfile?.created_at) {
    verifierProfileId = verifierProfile.id;
    const created = new Date(verifierProfile.created_at).getTime();
    verifierAccountAgeHours = (Date.now() - created) / (60 * 60 * 1000);
    if (verifierAccountAgeHours < ACCOUNT_AGE_HOURS_THRESHOLD && action === "confirm") {
      impactScore = 0;
    }
  }

  const newStatus = action === "confirm" ? "confirmed" : "denied";
  const eventType =
    action === "confirm" ? "coworker_verified" : "employment_disputed";

  const payload: Record<string, unknown> = {
    invite_id: invite.id,
    verifier_id: invite.email,
    company: invite.company ?? undefined,
    responded_via: "invite_link",
  };

  const insertPayload = {
    profile_id: invite.candidate_id,
    event_type: eventType,
    event_source: "invite_verification",
    impact_score: impactScore,
    payload: payload as Json,
    verification_ip: clientIp,
  };

  const { error: eventError } = await admin
    .from("trust_events")
    .insert(insertPayload as { profile_id: string; event_type: string; event_source: string; impact_score: number; payload?: Json; verification_ip?: string | null });

  if (eventError) {
    console.error("[verification/invite/respond] trust_events insert", eventError);
    return NextResponse.json(
      { error: "Failed to record response" },
      { status: 500 }
    );
  }

  // Same-company mismatch: log for fraud monitoring; verification already succeeded.
  if (companyMismatch) {
    const { data: candEmp } = await admin
      .from("employment_records")
      .select("company_name")
      .eq("user_id", invite.candidate_id)
      .limit(1)
      .maybeSingle();
    const candidateCompany = (candEmp as { company_name?: string } | null)?.company_name ?? null;
    await admin.from("trust_events").insert({
      profile_id: invite.candidate_id as string,
      event_type: "suspicious_verification",
      event_source: "invite_verification",
      impact_score: 0,
      payload: {
        candidate_company: candidateCompany,
        invite_company: invite.company,
        verifier_id: invite.email,
      } as Json,
      verification_ip: clientIp,
    });
  }

  // Account age < 24h: log low_trust_verifier.
  if (
    action === "confirm" &&
    verifierAccountAgeHours != null &&
    verifierAccountAgeHours < ACCOUNT_AGE_HOURS_THRESHOLD
  ) {
    await admin.from("trust_events").insert({
      profile_id: invite.candidate_id as string,
      event_type: "low_trust_verifier",
      event_source: "invite_verification",
      impact_score: 0,
      payload: {
        verifier_id: invite.email,
        account_age_hours: Math.round(verifierAccountAgeHours * 10) / 10,
      } as Json,
      verification_ip: clientIp,
    });
  }

  // Suspicious IP: many verifications from same IP in short window.
  if (clientIp) {
    const windowStart = new Date(Date.now() - SUSPICIOUS_IP_WINDOW_HOURS * 60 * 60 * 1000).toISOString();
    const { count } = await admin
      .from("trust_events")
      .select("id", { count: "exact", head: true })
      .eq("verification_ip", clientIp)
      .gte("created_at", windowStart);

    if ((count ?? 0) >= SUSPICIOUS_IP_COUNT_THRESHOLD) {
      await admin.from("trust_events").insert({
        profile_id: invite.candidate_id,
        event_type: "suspicious_ip_activity",
        event_source: "invite_verification",
        impact_score: 0,
        payload: {
          ip_address: clientIp,
          verification_count: count ?? 0,
        } as unknown as Json,
        verification_ip: clientIp,
      });
    }
  }

  // 5) Verification ring – Rule 2: if 3 users mutually verify each other within 24h, log suspicious_network (reduces fake rings).
  if (action === "confirm") {
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: recent } = await admin
      .from("trust_events")
      .select("profile_id, payload")
      .in("event_type", ["coworker_verified", "coworker_verification_confirmed"])
      .gte("created_at", dayAgo);

    const verifierEmails = new Set<string>();
    for (const r of recent ?? []) {
      const v = (r.payload as { verifier_id?: string } | null)?.verifier_id;
      if (typeof v === "string") verifierEmails.add(v);
    }
    if (verifierEmails.size >= 2) {
      const { data: profiles } = await admin
        .from("profiles")
        .select("id, email")
        .in("email", [...verifierEmails]);
      const emailToPid = new Map<string, string>();
      for (const p of profiles ?? []) {
        const e = (p as { email?: string }).email;
        const id = (p as { id?: string }).id;
        if (e && id) emailToPid.set(e.toLowerCase(), id);
      }
      const edges: { a: string; b: string }[] = [];
      for (const r of recent ?? []) {
        const pid = r.profile_id as string;
        const verifierEmail = (r.payload as { verifier_id?: string } | null)?.verifier_id;
        const verifierPid = verifierEmail ? emailToPid.get(String(verifierEmail).toLowerCase()) : null;
        if (pid && verifierPid && pid !== verifierPid) edges.push({ a: pid, b: verifierPid });
      }
      const allIds = new Set<string>();
      edges.forEach((e) => {
        allIds.add(e.a);
        allIds.add(e.b);
      });
      let suspiciousRing = false;
      for (const idA of allIds) {
        const toB = edges.filter((e) => e.a === idA).map((e) => e.b);
        for (const idB of toB) {
          const toC = edges.filter((e) => e.a === idB).map((e) => e.b);
          for (const idC of toC) {
            const backToA = edges.some((e) => e.a === idC && e.b === idA);
            if (backToA && new Set([idA, idB, idC]).size >= 3) {
              suspiciousRing = true;
              break;
            }
          }
          if (suspiciousRing) break;
        }
        if (suspiciousRing) break;
      }
      if (suspiciousRing) {
        await admin.from("trust_events").insert({
          profile_id: invite.candidate_id as string,
          event_type: "suspicious_network",
          event_source: "invite_verification",
          impact_score: 0,
          payload: {
            users_involved: "3-way mutual verification in 24h",
          } as Json,
          verification_ip: clientIp,
        });
      }
    }
  }

  const { error: updateError } = await admin
    .from("verification_invites")
    .update({
      status: newStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("token", token.trim());

  if (updateError) {
    console.error("[verification/invite/respond] update status", updateError);
    return NextResponse.json(
      { error: "Failed to update invite status" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    status: newStatus,
    message:
      action === "confirm"
        ? "Thank you for confirming employment."
        : "Your response has been recorded.",
  });
}
