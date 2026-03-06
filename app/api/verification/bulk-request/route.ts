/**
 * POST /api/verification/bulk-request
 * Create verification requests for multiple coworkers (by profile id).
 * Body: { employment_record_id, coworker_ids: string[] }
 * Max 10 per job. Each coworker_id is a profile id; email is resolved server-side.
 */

import { NextRequest, NextResponse } from "next/server";
import { getEffectiveUser } from "@/lib/auth";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { randomBytes } from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BULK_PER_REQUEST = 10;

export async function POST(req: NextRequest) {
  const effective = await getEffectiveUser();
  if (!effective?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { employment_record_id?: string; coworker_ids?: string[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const employmentRecordId = typeof body.employment_record_id === "string" ? body.employment_record_id : null;
  const rawIds = Array.isArray(body.coworker_ids)
    ? (body.coworker_ids as string[]).filter((id) => typeof id === "string")
    : [];

  if (!employmentRecordId || rawIds.length === 0) {
    return NextResponse.json(
      { error: "employment_record_id and coworker_ids (non-empty array) are required" },
      { status: 400 }
    );
  }

  const coworkerIds = rawIds.slice(0, MAX_BULK_PER_REQUEST);
  const supabase = getSupabaseServer();

  const { data: requesterProfile } = await supabase
    .from("profiles")
    .select("id")
    .or(`id.eq.${effective.id},user_id.eq.${effective.id}`)
    .maybeSingle();
  const requesterProfileId = (requesterProfile as { id: string } | null)?.id ?? effective.id;

  const { data: empRecord, error: empErr } = await supabase
    .from("employment_records")
    .select("id")
    .eq("id", employmentRecordId)
    .eq("user_id", requesterProfileId)
    .maybeSingle();

  if (empErr || !empRecord) {
    return NextResponse.json({ error: "Employment record not found or not yours" }, { status: 404 });
  }

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, email")
    .in("id", coworkerIds);

  const idToEmail = new Map<string, string>();
  for (const p of profiles ?? []) {
    const row = p as { id: string; email?: string | null };
    const email = row.email?.trim().toLowerCase();
    if (email) idToEmail.set(row.id, email);
  }

  const myEmailRow = await supabase.from("profiles").select("email").eq("id", requesterProfileId).maybeSingle();
  const myEmail = (myEmailRow.data as { email?: string } | null)?.email?.trim().toLowerCase() ?? null;

  const created: string[] = [];
  const skipped: Array<{ profileId: string; reason: string }> = [];

  for (const profileId of coworkerIds) {
    const targetEmail = idToEmail.get(profileId);
    if (!targetEmail) {
      skipped.push({ profileId, reason: "no_email" });
      continue;
    }
    if (myEmail && targetEmail === myEmail) {
      skipped.push({ profileId, reason: "own_email" });
      continue;
    }

    const { data: existing } = await supabase
      .from("verification_requests")
      .select("id")
      .eq("requester_profile_id", requesterProfileId)
      .eq("target_email", targetEmail)
      .eq("employment_record_id", employmentRecordId)
      .eq("status", "pending")
      .maybeSingle();

    if (existing) {
      skipped.push({ profileId, reason: "pending_exists" });
      continue;
    }

    const responseToken = randomBytes(32).toString("base64url");
    const { error: insertErr } = await supabase.from("verification_requests").insert({
      requester_profile_id: requesterProfileId,
      target_email: targetEmail,
      target_profile_id: profileId,
      employment_record_id: employmentRecordId,
      relationship_type: "coworker",
      status: "pending",
      response_token: responseToken,
      delivery_method: "email",
    });

    if (!insertErr) created.push(profileId);
    else skipped.push({ profileId, reason: insertErr.message });
  }

  return NextResponse.json({
    created: created.length,
    created_ids: created,
    skipped: skipped.length,
    skipped_details: skipped,
  });
}
