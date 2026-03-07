/**
 * POST /api/verification/invite
 * Create a coworker verification invite. Generates secure token and returns invite link.
 * Body: { candidateId, email, phone, company, role }
 * Does not send SMS or email — only generates the invite link.
 */

import { NextRequest, NextResponse } from "next/server";
import { getEffectiveUser } from "@/lib/auth";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { randomBytes } from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DAILY_INVITE_LIMIT_PER_CANDIDATE = 10;

function secureToken(): string {
  return randomBytes(32).toString("hex");
}

export async function POST(req: NextRequest) {
  const effective = await getEffectiveUser();
  if (!effective?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    candidateId?: string;
    email?: string;
    phone?: string;
    company?: string;
    role?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const candidateId =
    typeof body.candidateId === "string" ? body.candidateId.trim() : null;
  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : null;
  const phone = typeof body.phone === "string" ? body.phone.trim() : null;
  const company =
    typeof body.company === "string" ? body.company.trim() : null;
  const role = typeof body.role === "string" ? body.role.trim() : null;

  if (!candidateId) {
    return NextResponse.json(
      { error: "candidateId is required" },
      { status: 400 }
    );
  }
  if (!email) {
    return NextResponse.json(
      { error: "email is required" },
      { status: 400 }
    );
  }

  const supabase = getSupabaseServer();
  const sb = supabase as any;

  // Rate limit: prevent invite spam. Max 10 invites per candidate per 24h.
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count, error: countError } = await sb
    .from("verification_invites")
    .select("id", { count: "exact", head: true })
    .eq("candidate_id", candidateId)
    .gte("created_at", twentyFourHoursAgo);

  if (!countError && (count ?? 0) >= DAILY_INVITE_LIMIT_PER_CANDIDATE) {
    return NextResponse.json(
      { error: "Daily invite limit reached" },
      { status: 429 }
    );
  }

  const token = secureToken();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + INVITE_EXPIRATION_HOURS * 60 * 60 * 1000);

  const { error } = await sb.from("verification_invites").insert({
    token,
    candidate_id: candidateId,
    email,
    verifier_email: email,
    phone: phone || null,
    company: company || null,
    role: role || null,
    status: "pending",
    expires_at: expiresAt.toISOString(),
    updated_at: now.toISOString(),
  });

  if (error) {
    console.error("[verification/invite] insert error", error);
    return NextResponse.json(
      { error: error.message || "Failed to create invite" },
      { status: 500 }
    );
  }

  const inviteLink = `/verify/${token}`;

  return NextResponse.json({
    inviteLink,
    token,
  });
}
