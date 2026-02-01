/**
 * GET /api/admin/dispute-evidence/[id]/signed-url
 * Returns a signed URL to view evidence. Admin only.
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { getSupabaseServer } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const BUCKET = "dispute-evidence";
const EXPIRES_IN = 300;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const admin = await isAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const sb = getSupabaseServer() as any;

    const { data: evidence, error: evidenceErr } = await sb
      .from("dispute_evidence")
      .select("id, file_url")
      .eq("id", id)
      .single();

    if (evidenceErr || !evidence) {
      return NextResponse.json({ error: "Evidence not found" }, { status: 404 });
    }

    const { data: signed, error: signErr } = await sb.storage
      .from(BUCKET)
      .createSignedUrl(evidence.file_url, EXPIRES_IN);

    if (signErr) {
      console.error("[admin/dispute-evidence/signed-url] sign error:", signErr);
      return NextResponse.json({ error: "Failed to create signed URL" }, { status: 500 });
    }

    return NextResponse.json({
      url: signed.signedUrl,
      expiresIn: EXPIRES_IN,
    });
  } catch (e) {
    console.error("[admin/dispute-evidence/signed-url] error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
