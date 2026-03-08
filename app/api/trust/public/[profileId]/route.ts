// IMPORTANT:
// All server routes must use the `admin` Supabase client.
// Do not use `supabase` in API routes.

/**
 * GET /api/trust/public/[profileId]
 * Public: returns only name, trust score, verification count (no email, phone, or private data).
 */

import { NextRequest, NextResponse } from "next/server";
import { admin } from "@/lib/supabase-admin";
import { getTrustScore } from "@/lib/trust/getTrustScore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ profileId: string }> }
) {
  const { profileId } = await params;
  if (!profileId?.trim()) {
    return NextResponse.json({ error: "profileId required" }, { status: 400 });
  }
  const { data: profile } = await admin
    .from("profiles")
    .select("id, full_name")
    .eq("id", profileId.trim())
    .maybeSingle();

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const name = (profile as { full_name?: string }).full_name ?? "—";
  const { trustScore, verificationCount } = await getTrustScore(profileId.trim());

  return NextResponse.json({
    profileId: profileId.trim(),
    name,
    trustScore,
    verificationCount,
  });
}
