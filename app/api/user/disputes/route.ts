/**
 * POST /api/user/disputes
 * Submit a dispute. Rate limit: 3 open disputes; 30-day cooldown per related_record_id.
 * Zod validated. Logs abusive submissions.
 */

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
import { getEffectiveUser } from "@/lib/auth";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { refreshUserDisputeTransparency } from "@/lib/dispute-audit";
import { rejectWriteIfImpersonating } from "@/lib/server/rejectWriteIfImpersonating";
import { z } from "zod";

export const dynamic = "force-dynamic";

const MAX_OPEN_DISPUTES = 3;
const COOLDOWN_DAYS = 30;

const bodySchema = z.object({
  dispute_type: z.enum(["employment", "reference", "fraud_flag", "trust_score", "rehire_status"]),
  related_record_id: z.string().uuid(),
  description: z.string().min(10).max(5000),
});

export async function POST(req: NextRequest) {
  try {
    const reject = await rejectWriteIfImpersonating();
    if (reject) return reject;

    const effective = await getEffectiveUser();
    if (!effective || effective.deleted_at) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const effectiveUserId = effective.id;

    const body = await req.json().catch(() => ({}));
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const sb = getSupabaseServer() as any;
    const { dispute_type, related_record_id, description } = parsed.data;

    const { count: openCount } = await sb
      .from("disputes")
      .select("id", { count: "exact", head: true })
      .eq("user_id", effectiveUserId)
      .in("status", ["open", "under_review"]);

    if ((openCount ?? 0) >= MAX_OPEN_DISPUTES) {
      return NextResponse.json(
        { error: "Maximum open disputes reached. Resolve or wait for existing disputes." },
        { status: 429 }
      );
    }

    const cooldownSince = new Date();
    cooldownSince.setDate(cooldownSince.getDate() - COOLDOWN_DAYS);
    const { data: recentSame } = await sb
      .from("disputes")
      .select("id, created_at")
      .eq("user_id", effectiveUserId)
      .eq("related_record_id", related_record_id)
      .eq("dispute_type", dispute_type)
      .gte("created_at", cooldownSince.toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (recentSame) {
      return NextResponse.json(
        { error: "You recently disputed this record. Please wait 30 days before disputing again." },
        { status: 429 }
      );
    }

    const { data: dispute, error } = await sb
      .from("disputes")
      .insert({
        user_id: effectiveUserId,
        dispute_type,
        related_record_id,
        description,
        status: "open",
      })
      .select("id, status, created_at")
      .single();

    if (error) {
      if ((error as { code?: string }).code === "23505") {
        return NextResponse.json(
          { error: "An open dispute already exists for this record." },
          { status: 409 }
        );
      }
      console.error("[user/disputes] insert error:", error);
      return NextResponse.json({ error: "Failed to create dispute" }, { status: 500 });
    }

    await refreshUserDisputeTransparency(effectiveUserId);

    return NextResponse.json({
      id: dispute.id,
      status: dispute.status,
      created_at: dispute.created_at,
    });
  } catch (e) {
    console.error("[user/disputes] error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
