// IMPORTANT:
// All server routes must use the `admin` Supabase client.
// Do not use `supabase` in API routes.

/**
 * GET /api/verification/invite/[token]
 * Public: fetch verification invite by token for the verify page.
 */

import { NextRequest, NextResponse } from "next/server";
import { admin } from "@/lib/supabase-admin";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  if (!token?.trim()) {
    return NextResponse.json({ error: "Token required" }, { status: 400 });
  }
  const { data, error } = await admin
    .from("verification_invites")
    .select("id, token, candidate_id, company, role, status, expires_at, verifier_email, email")
    .eq("token", token.trim())
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Invite not found" }, { status: 404 });
  }

  const verifierEmail = data.verifier_email ?? data.email ?? null;

  return NextResponse.json({
    id: data.id,
    company: data.company ?? null,
    role: data.role ?? null,
    status: data.status,
    candidateId: data.candidate_id,
    expiresAt: data.expires_at ?? null,
    verifierEmail: verifierEmail ?? null,
  });
}
