/**
 * POST /api/user/appeals
 * Submit an appeal for a resolved or rejected dispute. Only 1 appeal per dispute. Zod validated.
 */

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
import { getCurrentUser } from "@/lib/auth";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { z } from "zod";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  dispute_id: z.string().uuid(),
  appeal_reason: z.string().min(10).max(2000),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const sb = getSupabaseServer() as any;
    const { dispute_id, appeal_reason } = parsed.data;

    const { data: dispute, error: disputeErr } = await sb
      .from("disputes")
      .select("id, user_id, status")
      .eq("id", dispute_id)
      .single();

    if (disputeErr || !dispute) {
      return NextResponse.json({ error: "Dispute not found" }, { status: 404 });
    }

    if (dispute.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (dispute.status !== "resolved" && dispute.status !== "rejected") {
      return NextResponse.json(
        { error: "Appeals are only allowed for resolved or rejected disputes." },
        { status: 400 }
      );
    }

    const { data: existing } = await sb
      .from("appeals")
      .select("id")
      .eq("dispute_id", dispute_id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: "An appeal already exists for this dispute." },
        { status: 409 }
      );
    }

    const { data: appeal, error: insertErr } = await sb
      .from("appeals")
      .insert({
        dispute_id,
        user_id: user.id,
        appeal_reason,
        status: "pending",
      })
      .select("id, status, created_at")
      .single();

    if (insertErr) {
      if ((insertErr as { code?: string }).code === "23505") {
        return NextResponse.json(
          { error: "An appeal already exists for this dispute." },
          { status: 409 }
        );
      }
      console.error("[user/appeals] insert error:", insertErr);
      return NextResponse.json({ error: "Failed to create appeal" }, { status: 500 });
    }

    return NextResponse.json({
      id: appeal.id,
      status: appeal.status,
      created_at: appeal.created_at,
    });
  } catch (e) {
    console.error("[user/appeals] error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
