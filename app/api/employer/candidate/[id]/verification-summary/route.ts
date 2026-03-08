// IMPORTANT:
// All server routes must use the `admin` Supabase client.
// Do not use `supabase` in API routes.

/**
 * GET /api/employer/candidate/[id]/verification-summary
 * Section 7 — Employer value: Verified By (Manager, Coworker, Client) and Total Confirmations.
 * Returns counts from accepted verification_requests where requester_profile_id = candidate id.
 */

import { NextRequest, NextResponse } from "next/server";
import { getEffectiveUser } from "@/lib/auth";
import { admin } from "@/lib/supabase-admin";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id: candidateId } = await context.params;
  if (!candidateId) {
    return NextResponse.json({ error: "Missing candidate id" }, { status: 400 });
  }

  const effective = await getEffectiveUser();
  if (!effective?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { data: callerProfile } = await admin.from("profiles")
    .select("role")
    .or(`id.eq.${effective.id},user_id.eq.${effective.id}`)
    .maybeSingle();
  const role = (callerProfile as { role?: string } | null)?.role ?? null;
  if (role !== "employer") {
    return NextResponse.json({ error: "Employer access only" }, { status: 403 });
  }

  const { data: rows, error } = await admin.from("verification_requests")
    .select("relationship_type")
    .eq("requester_profile_id", candidateId)
    .eq("status", "accepted");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const list = (rows ?? []) as Array<{ relationship_type: string }>;
  const manager = list.filter((r) => r.relationship_type === "manager").length;
  const coworker = list.filter((r) => r.relationship_type === "coworker").length;
  const client = list.filter((r) => r.relationship_type === "client").length;
  const peer = list.filter((r) => r.relationship_type === "peer").length;
  const total = list.length;

  return NextResponse.json({
    manager,
    coworker,
    client,
    peer,
    total,
  });
}
