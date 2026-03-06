/**
 * POST /api/verification/request
 * Create a verification request. Target may not have an account (invite flow).
 * Body: { target_email, employment_record_id, relationship_type?: 'coworker' | 'manager' | 'peer' }
 */

import { NextRequest, NextResponse } from "next/server";
import { getEffectiveUser } from "@/lib/auth";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { randomBytes } from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function POST(req: NextRequest) {
  const effective = await getEffectiveUser();
  if (!effective?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { target_email?: string; employment_record_id?: string; relationship_type?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const targetEmail = typeof body.target_email === "string" ? normalizeEmail(body.target_email) : null;
  const employmentRecordId = typeof body.employment_record_id === "string" ? body.employment_record_id : null;
  const relationshipType = parseVerificationRelationshipType(body.relationship_type);

  if (!targetEmail || !employmentRecordId) {
    return NextResponse.json(
      { error: "target_email and employment_record_id are required" },
      { status: 400 }
    );
  }

  const supabase = getSupabaseServer();

  // Resolve requester profile id (effective.id may be user_id or profile id)
  const { data: requesterProfile } = await supabase
    .from("profiles")
    .select("id")
    .or(`id.eq.${effective.id},user_id.eq.${effective.id}`)
    .maybeSingle();
  const requesterProfileId = (requesterProfile as { id: string } | null)?.id ?? effective.id;

  // Ensure employment record belongs to requester
  const { data: empRecord, error: empErr } = await supabase
    .from("employment_records")
    .select("id, user_id, company_name, job_title")
    .eq("id", employmentRecordId)
    .eq("user_id", requesterProfileId)
    .maybeSingle();
  if (empErr || !empRecord) {
    return NextResponse.json({ error: "Employment record not found or not yours" }, { status: 404 });
  }

  // Don't allow requesting from own email
  const { data: myProfile } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", requesterProfileId)
    .maybeSingle();
  const myEmail = (myProfile as { email?: string } | null)?.email;
  if (myEmail && normalizeEmail(myEmail) === targetEmail) {
    return NextResponse.json({ error: "Cannot send verification request to your own email" }, { status: 400 });
  }

  // Find target profile by email if exists
  const { data: targetProfile } = await supabase
    .from("profiles")
    .select("id")
    .ilike("email", targetEmail)
    .maybeSingle();
  const targetProfileId = (targetProfile as { id: string } | null)?.id ?? null;

  // Optional: prevent duplicate pending request for same (requester, target_email, employment_record_id)
  const { data: existing } = await supabase
    .from("verification_requests")
    .select("id")
    .eq("requester_profile_id", requesterProfileId)
    .eq("target_email", targetEmail)
    .eq("employment_record_id", employmentRecordId)
    .eq("status", "pending")
    .maybeSingle();
  if (existing) {
    return NextResponse.json(
      { error: "A pending request already exists for this email and employment" },
      { status: 409 }
    );
  }

  const responseToken = randomBytes(32).toString("base64url");

  const { data: inserted, error } = await supabase
    .from("verification_requests")
    .insert({
      requester_profile_id: requesterProfileId,
      target_email: targetEmail,
      target_profile_id: targetProfileId,
      employment_record_id: employmentRecordId,
      relationship_type: relationshipType,
      status: "pending",
      response_token: responseToken,
    })
    .select("id, target_email, status, response_token, created_at")
    .single();

  if (error) {
    console.error("[verification/request]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    request_id: (inserted as { id: string }).id,
    target_email: (inserted as { target_email: string }).target_email,
    status: (inserted as { status: string }).status,
    response_token: (inserted as { response_token: string }).response_token,
    created_at: (inserted as { created_at: string }).created_at,
    has_account: !!targetProfileId,
  });
}
