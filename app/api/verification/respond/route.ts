// IMPORTANT:
// All server routes must use the `admin` Supabase client.
// Do not use `supabase` in API routes.

/**
 * POST /api/verification/respond
 * Respond to a verification request: accept | decline.
 * Body: { request_id?: string, response_token?: string, response: 'accept' | 'decline' }
 * When accepting: create trust_relationships, log trust_events, update employment_records.verification_status.
 */

import { NextRequest, NextResponse } from "next/server";
import { getEffectiveUser } from "@/lib/auth";
import { admin } from "@/lib/supabase-admin";
import { evaluateTrustAutomationRules } from "@/lib/trust/automation";
import { calculateTrustScore } from "@/lib/trustScore";
import { mapToTrustRelationshipType } from "@/lib/verification/relationshipTypes";

export const runtime = "nodejs";

/** When a job reaches >= 2 confirmations: log trust_event. Confidence score is computed by DB view from jobs + verification_requests. */
async function applyJobVerifiedConfidenceScore(
  adminAny: any,
  userId: string,
  jobId: string,
  acceptedCount: number
) {
  const verifiedJobPoints = 20;
  const perConfirmationPoints = 10;
  const bonus3Plus = acceptedCount >= 3 ? 10 : 0;
  const delta = verifiedJobPoints + acceptedCount * perConfirmationPoints + bonus3Plus;

  await adminAny.from("trust_events").insert({
    profile_id: userId,
    event_type: "job_verified",
    event_source: "coworker_confirmations",
    payload: { job_id: jobId, confirmations: acceptedCount, score_delta: delta },
    created_at: new Date().toISOString(),
  });
}
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const effective = await getEffectiveUser();
  if (!effective?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { request_id?: string; response_token?: string; response?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const response = body.response === "accept" || body.response === "decline" ? body.response : null;
  if (!response) {
    return NextResponse.json({ error: "response must be 'accept' or 'decline'" }, { status: 400 });
  }
  const { data: profileRow } = await admin.from("profiles")
    .select("id, email")
    .or(`id.eq.${effective.id},user_id.eq.${effective.id}`)
    .maybeSingle();
  const currentProfileId = (profileRow as { id: string } | null)?.id ?? effective.id;
  const currentEmail = (profileRow as { email?: string } | null)?.email?.trim().toLowerCase() ?? null;

  type RequestRow = {
    id: string;
    requester_profile_id: string;
    target_email: string;
    target_profile_id: string | null;
    employment_record_id: string | null;
    job_id: string | null;
    relationship_type: string;
    status: string;
  };

  const selectCols = "id, requester_profile_id, target_email, target_profile_id, employment_record_id, job_id, relationship_type, status";
  let requestRow: RequestRow | null = null;

  if (body.request_id) {
    const { data, error } = await admin.from("verification_requests")
      .select(selectCols)
      .eq("id", body.request_id)
      .eq("status", "pending")
      .maybeSingle();
    if (error || !data) {
      return NextResponse.json({ error: "Request not found or already responded" }, { status: 404 });
    }
    requestRow = data as unknown as RequestRow;
  } else if (body.response_token) {
    const { data, error } = await admin.from("verification_requests")
      .select(selectCols)
      .eq("response_token", body.response_token)
      .eq("status", "pending")
      .maybeSingle();
    if (error || !data) {
      return NextResponse.json({ error: "Request not found or already responded" }, { status: 404 });
    }
    requestRow = data as unknown as RequestRow;
  }

  if (!requestRow) {
    return NextResponse.json({ error: "Provide request_id or response_token" }, { status: 400 });
  }

  const targetEmail = requestRow.target_email.trim().toLowerCase();
  const isTarget =
    requestRow.target_profile_id === currentProfileId ||
    (currentEmail !== null && currentEmail === targetEmail);

  if (!isTarget) {
    return NextResponse.json({ error: "You are not the recipient of this request" }, { status: 403 });
  }

  // If target had no profile when request was sent, link them now
  if (!requestRow.target_profile_id) {
    await admin.from("verification_requests")
      .update({ target_profile_id: currentProfileId })
      .eq("id", requestRow.id);
  }

  const { error: updateErr } = await admin.from("verification_requests")
    .update({
      status: response === "accept" ? "accepted" : "declined",
      responded_at: new Date().toISOString(),
    })
    .eq("id", requestRow.id);

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  if (response === "accept") {
    const requesterId = requestRow.requester_profile_id;
    const targetId = currentProfileId;
    const relType = mapToTrustRelationshipType(requestRow.relationship_type);
    const adminAny = admin as any;

    // 1) Create trust_relationships
    const verificationLevel = "verified";
    await admin.from("trust_relationships").upsert(
      [
        {
          source_profile_id: requesterId,
          target_profile_id: targetId,
          relationship_type: relType,
          verification_level: verificationLevel,
          verification_source: "mutual_confirmation",
          strength: 1,
        },
      ],
      { onConflict: "source_profile_id,target_profile_id,relationship_type" }
    );

    // 2) Resolve meta from job or employment_record
    let meta: Record<string, unknown> = { source: "verification_request" };
    if (requestRow.job_id) {
      const { data: jobRow } = await admin.from("jobs")
        .select("user_id, company_name, title")
        .eq("id", requestRow.job_id)
        .maybeSingle();
      if (jobRow) {
        const j = jobRow as { company_name?: string; title?: string; user_id?: string };
        meta = { company_name: j.company_name, job_title: j.title, job_id: requestRow.job_id, source: "verification_request" };
      }
    } else if (requestRow.employment_record_id) {
      const { data: empRecord } = await admin.from("employment_records")
        .select("company_name, job_title")
        .eq("id", requestRow.employment_record_id)
        .maybeSingle();
      if (empRecord) {
        meta = { company_name: (empRecord as { company_name?: string }).company_name, job_title: (empRecord as { job_title?: string }).job_title, source: "verification_request" };
      }
    }

    await adminAny.from("trust_events").insert({
      profile_id: requesterId,
      event_type: "verification",
      event_source: "verification_request_accepted",
      payload: meta,
      created_at: new Date().toISOString(),
    });
    await adminAny.from("trust_events").insert({
      profile_id: requesterId,
      event_type: "verification_confirmed",
      event_source: "verification_request_accepted",
      payload: { ...meta, target_profile_id: targetId, relationship_type: requestRow.relationship_type },
      created_at: new Date().toISOString(),
    });
    if (requestRow.relationship_type === "coworker") {
      await adminAny.from("trust_events").insert({
        profile_id: requesterId,
        event_type: "coworker_verification_confirmed",
        event_source: "verification_request_accepted",
        payload: { ...meta, target_profile_id: targetId },
        created_at: new Date().toISOString(),
      });
    }
    try {
      await evaluateTrustAutomationRules(requesterId, "verification", admin);
    } catch (e) {
      console.error("[verification/respond] Trust automation:", e);
    }

    // 3a) Job-based flow: count accepted requests; if >= 2 set job verified and update confidence score
    if (requestRow.job_id) {
      const { data: acceptedList } = await admin.from("verification_requests")
        .select("id")
        .eq("job_id", requestRow.job_id)
        .eq("status", "accepted");
      const acceptedCount = (acceptedList ?? []).length;
      if (acceptedCount >= 2) {
        const { data: jobRow } = await admin.from("jobs")
          .select("user_id")
          .eq("id", requestRow.job_id)
          .single();
        const jobUserId = (jobRow as { user_id?: string } | null)?.user_id;
        await admin.from("jobs")
          .update({ verification_status: "verified", updated_at: new Date().toISOString() })
          .eq("id", requestRow.job_id);
        if (jobUserId) {
          await applyJobVerifiedConfidenceScore(adminAny, jobUserId, requestRow.job_id, acceptedCount);
          await calculateTrustScore(jobUserId).catch((e) =>
            console.warn("[calculateTrustScore] job verified", e)
          );
        }
      }
    }

    // 3b) Employment-record flow: update employment_records.verification_status
    if (requestRow.employment_record_id) {
      await admin.from("employment_records")
        .update({ verification_status: "verified", updated_at: new Date().toISOString() })
        .eq("id", requestRow.employment_record_id);
    }
  }

  return NextResponse.json({
    success: true,
    response,
    request_id: requestRow.id,
  });
}
