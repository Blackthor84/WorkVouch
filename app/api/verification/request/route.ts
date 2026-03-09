// IMPORTANT:
// All server routes must use the `admin` Supabase client.
// Do not use `supabase` in API routes.

/**
 * POST /api/verification/request
 * Create a verification request. Target may not have an account (invite flow).
 * Body: { target_email?, target_profile_id?, phone_number?, employment_record_id, relationship_type?, delivery_method? }
 * Either target_email or target_profile_id required. target_profile_id resolves email server-side (coworker discovery).
 * delivery_method: 'email' | 'sms' | 'email_and_sms' (default email).
 */

import { NextRequest, NextResponse } from "next/server";
import { getEffectiveUser } from "@/lib/auth";
import { admin } from "@/lib/supabase-admin";
import { parseVerificationRelationshipType } from "@/lib/verification/parseVerificationRelationshipType";
import { normalizePhoneNumber } from "@/lib/verification/normalizePhoneNumber";
import { sendVerificationSms } from "@/lib/sms/sendSms";
import { randomBytes } from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VERIFICATION_REQUEST_RATE_LIMIT_PER_HOUR = 20;

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function POST(req: NextRequest) {
  const effective = await getEffectiveUser();
  if (!effective?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    target_email?: string;
    target_profile_id?: string;
    phone_number?: string;
    employment_record_id?: string;
    relationship_type?: unknown;
    delivery_method?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const employmentRecordId = typeof body.employment_record_id === "string" ? body.employment_record_id : null;
  const relationshipType = parseVerificationRelationshipType(body.relationship_type);
  const deliveryMethod =
    body.delivery_method === "sms" || body.delivery_method === "email_and_sms"
      ? body.delivery_method
      : "email";

  if (!employmentRecordId) {
    return NextResponse.json(
      { error: "employment_record_id is required" },
      { status: 400 }
    );
  }
  let targetEmail: string | null = typeof body.target_email === "string" ? normalizeEmail(body.target_email) : null;
  let targetProfileId: string | null = typeof body.target_profile_id === "string" ? body.target_profile_id : null;

  if (targetProfileId && !targetEmail) {
    const { data: targetProfile } = await admin.from("profiles")
      .select("id, email")
      .eq("id", targetProfileId)
      .maybeSingle();
    const email = (targetProfile as { email?: string } | null)?.email;
    targetEmail = typeof email === "string" && email.trim() ? normalizeEmail(email) : null;
    if (!targetEmail) {
      return NextResponse.json(
        { error: "Target profile has no email; use target_email instead" },
        { status: 400 }
      );
    }
  } else if (!targetEmail) {
    return NextResponse.json(
      { error: "target_email or target_profile_id is required" },
      { status: 400 }
    );
  }

  const rawPhone = typeof body.phone_number === "string" ? body.phone_number : null;
  const phoneNumber = rawPhone ? normalizePhoneNumber(rawPhone) : null;

  if (!relationshipType) {
    return NextResponse.json(
      { error: "Invalid relationship type" },
      { status: 400 }
    );
  }

  if ((deliveryMethod === "sms" || deliveryMethod === "email_and_sms") && !phoneNumber) {
    return NextResponse.json(
      { error: "phone_number is required when delivery_method includes sms" },
      { status: 400 }
    );
  }

  if (rawPhone && !phoneNumber) {
    return NextResponse.json(
      { error: "Invalid phone number; use E.164 format (e.g. +16035551234)" },
      { status: 400 }
    );
  }

  // Resolve requester profile id (effective.id may be user_id or profile id)
  const { data: requesterProfile } = await admin.from("profiles")
    .select("id, full_name")
    .or(`id.eq.${effective.id},user_id.eq.${effective.id}`)
    .maybeSingle();
  const requesterProfileId = (requesterProfile as { id: string } | null)?.id ?? effective.id;
  const requesterName = (requesterProfile as { full_name?: string } | null)?.full_name ?? "Someone";

  // Rate limit: count requests by this user in the last hour
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count: recentCount, error: countErr } = await admin.from("verification_requests")
    .select("id", { count: "exact", head: true })
    .eq("requester_profile_id", requesterProfileId)
    .gte("created_at", oneHourAgo);
  const count = countErr ? 0 : (recentCount ?? 0);
  if (count >= VERIFICATION_REQUEST_RATE_LIMIT_PER_HOUR) {
    return NextResponse.json(
      { error: "Too many verification requests; try again later" },
      { status: 429 }
    );
  }

  // Ensure employment record belongs to requester
  const { data: empRecord, error: empErr } = await admin.from("employment_records")
    .select("id, user_id, company_name, job_title")
    .eq("id", employmentRecordId)
    .eq("user_id", requesterProfileId)
    .maybeSingle();
  if (empErr || !empRecord) {
    return NextResponse.json({ error: "Employment record not found or not yours" }, { status: 404 });
  }

  // Don't allow requesting from own email
  const { data: myProfile } = await admin.from("profiles")
    .select("email")
    .eq("id", requesterProfileId)
    .maybeSingle();
  const myEmail = (myProfile as { email?: string } | null)?.email;
  if (myEmail && normalizeEmail(myEmail) === targetEmail) {
    return NextResponse.json({ error: "Cannot send verification request to your own email" }, { status: 400 });
  }

  // Find target profile by email if not already set (e.g. from target_profile_id)
  if (!targetProfileId) {
    const { data: targetProfile } = await admin.from("profiles")
      .select("id")
      .ilike("email", targetEmail)
      .maybeSingle();
    targetProfileId = (targetProfile as { id: string } | null)?.id ?? null;
  }

  // Optional: prevent duplicate pending request for same (requester, target_email, employment_record_id)
  const { data: existing } = await admin.from("verification_requests")
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

  const insertPayload: Record<string, unknown> = {
    requester_profile_id: requesterProfileId,
    target_email: targetEmail,
    target_profile_id: targetProfileId,
    employment_record_id: employmentRecordId,
    relationship_type: relationshipType,
    status: "pending",
    response_token: responseToken,
    delivery_method: deliveryMethod,
  };
  if (phoneNumber) insertPayload.phone_number = phoneNumber;

  const { data: inserted, error } = await admin.from("verification_requests")
    .insert(insertPayload)
    .select("id, target_email, status, response_token, created_at")
    .single();

  if (error) {
    console.error("[verification/request]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const requestId = (inserted as { id: string }).id;
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "https://app.workvouch.com";
  const verificationLink = `${baseUrl}/verify/coworker/${responseToken}`;

  if (
    (deliveryMethod === "sms" || deliveryMethod === "email_and_sms") &&
    phoneNumber
  ) {
    const smsResult = await sendVerificationSms(
      phoneNumber,
      verificationLink,
      requesterName
    );
    if (!smsResult.ok) {
      console.error("[verification/request] SMS failed", smsResult.error);
      // Do not fail the request; email may still be sent by caller
    }
  }

  return NextResponse.json({
    request_id: requestId,
    target_email: (inserted as { target_email: string }).target_email,
    status: (inserted as { status: string }).status,
    response_token: (inserted as { response_token: string }).response_token,
    created_at: (inserted as { created_at: string }).created_at,
    has_account: !!targetProfileId,
    delivery_method: deliveryMethod,
  });
}
