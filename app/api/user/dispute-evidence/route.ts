/**
 * POST /api/user/dispute-evidence
 * Register evidence after client uploads to Supabase Storage (bucket: dispute-evidence).
 * Path must be {user_id}/{dispute_id}/{filename}. Validates ownership. Zod validated.
 */

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
import { getEffectiveUser } from "@/lib/auth";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { z } from "zod";

export const dynamic = "force-dynamic";

const BUCKET = "dispute-evidence";
const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"];

const bodySchema = z.object({
  dispute_id: z.string().uuid(),
  file_path: z.string().min(1).max(500),
  file_type: z.string().refine((t) => ALLOWED_TYPES.includes(t), {
    message: "Allowed: application/pdf, image/jpeg, image/png, image/webp",
  }),
});

export async function POST(req: NextRequest) {
  try {
    const effective = await getEffectiveUser();
    if (!effective || effective.deleted_at) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const { dispute_id, file_path, file_type } = parsed.data;
    const sb = getSupabaseServer() as any;

    const { data: dispute, error: disputeErr } = await sb
      .from("disputes")
      .select("id, user_id, status")
      .eq("id", dispute_id)
      .single();

    if (disputeErr || !dispute) {
      return NextResponse.json({ error: "Dispute not found" }, { status: 404 });
    }

    if (dispute.user_id !== effective.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const expectedPrefix = `${user.id}/${dispute_id}/`;
    if (!file_path.startsWith(expectedPrefix)) {
      return NextResponse.json(
        { error: "File path must be under your user and dispute folder" },
        { status: 400 }
      );
    }

    const { data: row, error: insertErr } = await sb
      .from("dispute_evidence")
      .insert({
        dispute_id,
        file_url: file_path,
        file_type,
        uploaded_by: effective.id,
      })
      .select("id, file_url, file_type, created_at")
      .single();

    if (insertErr) {
      console.error("[user/dispute-evidence] insert error:", insertErr);
      return NextResponse.json({ error: "Failed to register evidence" }, { status: 500 });
    }

    return NextResponse.json({
      id: row.id,
      file_url: row.file_url,
      file_type: row.file_type,
      created_at: row.created_at,
    });
  } catch (e) {
    console.error("[user/dispute-evidence] error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
