/**
 * GET /api/user/dispute-evidence/[id]/signed-url
 * Returns a signed URL to view/download evidence. User must own the dispute.
 * Expires in 60 seconds (short-lived for viewing).
 */

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
import { getEffectiveUser } from "@/lib/auth";
import { getSupabaseServer } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const BUCKET = "dispute-evidence";
const EXPIRES_IN = 60;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const effective = await getEffectiveUser();
    if (!effective || effective.deleted_at) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const sb = getSupabaseServer() as any;

    const { data: evidence, error: evidenceErr } = await sb
      .from("dispute_evidence")
      .select("id, dispute_id, file_url")
      .eq("id", id)
      .single();

    if (evidenceErr || !evidence) {
      return NextResponse.json({ error: "Evidence not found" }, { status: 404 });
    }

    const { data: dispute } = await sb
      .from("disputes")
      .select("user_id")
      .eq("id", evidence.dispute_id)
      .single();

    if (!dispute || dispute.user_id !== effective.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: signed, error: signErr } = await sb.storage
      .from(BUCKET)
      .createSignedUrl(evidence.file_url, EXPIRES_IN);

    if (signErr) {
      console.error("[dispute-evidence/signed-url] sign error:", signErr);
      return NextResponse.json({ error: "Failed to create signed URL" }, { status: 500 });
    }

    return NextResponse.json({
      url: signed.signedUrl,
      expiresIn: EXPIRES_IN,
    });
  } catch (e) {
    console.error("[dispute-evidence/signed-url] error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
