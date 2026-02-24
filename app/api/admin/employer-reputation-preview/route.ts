/**
 * POST /api/admin/employer-reputation-preview
 * Create a 10-minute preview_employer_simulations row for testing. Admin only.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdminSupabase } from "@/lib/auth/requireAdminSupabase";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  employer_id: z.string().uuid(),
});

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdminSupabase();
    if (auth instanceof NextResponse) return auth;

    const body = await req.json().catch(() => ({}));
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "employer_id required" }, { status: 400 });
    }

    const sb = getSupabaseServer() as any;
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const { data: row, error } = await sb
      .from("preview_employer_simulations")
      .insert({
        employer_id: parsed.data.employer_id,
        expires_at: expiresAt,
      })
      .select("id, expires_at")
      .single();

    if (error) {
      console.error("[admin/employer-reputation-preview]", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      id: (row as { id: string }).id,
      expires_at: (row as { expires_at: string }).expires_at,
    });
  } catch (e) {
    console.error("[admin/employer-reputation-preview]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
