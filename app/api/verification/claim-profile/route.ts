/**
 * POST /api/verification/claim-profile
 * After signup from "Claim Your WorkVouch Profile" flow: mark verification_invites as profile_claimed
 * and emit trust event verifier_joined_network for each invite linked to this user's email.
 * Requires an authenticated session (just completed signup).
 */

import { NextResponse } from "next/server";
import { getEffectiveUser } from "@/lib/auth";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { supabaseServer } from "@/lib/supabase/server";
import { emitTrustEvent } from "@/lib/trust/eventEngine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const effective = await getEffectiveUser();
  if (!effective?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let verifierEmail = (effective.email ?? "").trim().toLowerCase();
  if (!verifierEmail) {
    const supabase = await supabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    verifierEmail = (user?.email ?? "").trim().toLowerCase();
  }
  if (!verifierEmail) {
    return NextResponse.json({ error: "Email not found" }, { status: 400 });
  }

  const sb = getSupabaseServer() as any;

  const [byVerifier, byEmail] = await Promise.all([
    sb.from("verification_invites").select("id, candidate_id").eq("verifier_email", verifierEmail).eq("profile_claimed", false),
    sb.from("verification_invites").select("id, candidate_id").eq("email", verifierEmail).eq("profile_claimed", false),
  ]);

  const seen = new Set<string>();
  const rows: { id: string; candidate_id: string }[] = [];
  for (const r of (byVerifier.data ?? []) as { id: string; candidate_id: string }[]) {
    if (!seen.has(r.id)) {
      seen.add(r.id);
      rows.push(r);
    }
  }
  for (const r of (byEmail.data ?? []) as { id: string; candidate_id: string }[]) {
    if (!seen.has(r.id)) {
      seen.add(r.id);
      rows.push(r);
    }
  }
  if (byVerifier.error || byEmail.error) {
    return NextResponse.json(
      { error: (byVerifier.error ?? byEmail.error)?.message ?? "Failed to fetch invites" },
      { status: 500 }
    );
  }
  if (rows.length === 0) {
    return NextResponse.json({ success: true, claimed: 0 });
  }

  const { error: updateError } = await sb
    .from("verification_invites")
    .update({ profile_claimed: true })
    .in("id", rows.map((r) => r.id));

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  for (const row of rows) {
    try {
      await emitTrustEvent({
        profile_id: row.candidate_id,
        event_type: "verifier_joined_network",
        event_source: "verifier_claim_profile",
        impact_score: 0,
        metadata: { verifier_email: verifierEmail },
      });
    } catch (e) {
      console.error("[verification/claim-profile] emitTrustEvent", e);
    }
  }

  return NextResponse.json({ success: true, claimed: rows.length });
}
