/**
 * POST /api/verification/respond
 * Respond to a verification request: accept | decline.
 * Body: { request_id?: string, response_token?: string, response: 'accept' | 'decline' }
 * When accepting: create trust_relationships, log trust_events, update employment_records.verification_status.
 */

import { NextRequest, NextResponse } from "next/server";
import { getEffectiveUser } from "@/lib/auth";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { evaluateTrustAutomationRules } from "@/lib/trust/automation";
import { mapToTrustRelationshipType } from "@/lib/verification/relationshipTypes";

export const runtime = "nodejs";
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

  const supabase = getSupabaseServer();

  const { data: profileRow } = await supabase
    .from("profiles")
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
    employment_record_id: string;
    relationship_type: string;
    status: string;
  };

  let requestRow: RequestRow | null = null;

  if (body.request_id) {
    const { data, error } = await supabase
      .from("verification_requests")
      .select("id, requester_profile_id, target_email, target_profile_id, employment_record_id, relationship_type, status")
      .eq("id", body.request_id)
      .eq("status", "pending")
      .maybeSingle();
    if (error || !data) {
      return NextResponse.json({ error: "Request not found or already responded" }, { status: 404 });
    }
    requestRow = data as unknown as RequestRow;
  } else if (body.response_token) {
    const { data, error } = await supabase
      .from("verification_requests")
      .select("id, requester_profile_id, target_email, target_profile_id, employment_record_id, relationship_type, status")
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
    await supabase
      .from("verification_requests")
      .update({ target_profile_id: currentProfileId })
      .eq("id", requestRow.id);
  }

  const { error: updateErr } = await supabase
    .from("verification_requests")
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

    // 1) Create trust_relationships (manager/coworker confirmation → verification_source mutual_confirmation)
    const verificationLevel = "verified";
    await supabase.from("trust_relationships").upsert(
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

    // 2) Log trust_events for the profile that gets the verification (employment record owner = requester)
    const { data: empRecord } = await supabase
      .from("employment_records")
      .select("company_name, job_title")
      .eq("id", requestRow.employment_record_id)
      .maybeSingle();
    const meta = empRecord
      ? { company_name: (empRecord as { company_name?: string }).company_name, job_title: (empRecord as { job_title?: string }).job_title, source: "verification_request" }
      : { source: "verification_request" };
    await supabase.from("trust_events").insert({
      profile_id: requesterId,
      event_type: "verification",
      event_source: "verification_request_accepted",
      impact_score: 10,
      payload: meta,
      impact: "positive",
      metadata: meta,
      created_at: new Date().toISOString(),
    });
    // Section 4: trust_event for verification_confirmed (growth/analytics)
    await supabase.from("trust_events").insert({
      profile_id: requesterId,
      event_type: "verification_confirmed",
      event_source: "verification_request_accepted",
      impact_score: 10,
      payload: { ...meta, target_profile_id: targetId, relationship_type: requestRow.relationship_type },
      impact: "positive",
      metadata: meta,
      created_at: new Date().toISOString(),
    });
    try {
      await evaluateTrustAutomationRules(requesterId, "verification", supabase);
    } catch (e) {
      console.error("[verification/respond] Trust automation:", e);
    }

    // 3) Update employment_records.verification_status to verified
    await supabase
      .from("employment_records")
      .update({ verification_status: "verified", updated_at: new Date().toISOString() })
      .eq("id", requestRow.employment_record_id);
  }

  return NextResponse.json({
    success: true,
    response,
    request_id: requestRow.id,
  });
}
