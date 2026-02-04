/**
 * POST /api/employer/dispute-employment
 * Employer flags an employment record (sets verification_status to flagged).
 * Logs to audit_logs; triggers profile + match confidence.
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createServerSupabase } from "@/lib/supabase/server";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { hasRole } from "@/lib/auth";
import { logAudit } from "@/lib/dispute-audit";
import { z } from "zod";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  record_id: z.string().uuid(),
  reason: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!(await hasRole("employer"))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const supabase = await createServerSupabase();
    const supabaseAny = supabase as any;
    const adminSupabase = getSupabaseServer() as any;

    const { data: account } = await supabaseAny.from("employer_accounts").select("id").eq("user_id", user.id).single();
    if (!account) return NextResponse.json({ error: "Employer not found" }, { status: 404 });
    const employerId = (account as { id: string }).id;

    const { data: rec, error: fetchErr } = await adminSupabase
      .from("employment_records")
      .select("id, user_id, employer_id, verification_status")
      .eq("id", parsed.data.record_id)
      .single();

    if (fetchErr || !rec) return NextResponse.json({ error: "Employment record not found" }, { status: 404 });

    const row = rec as { employer_id: string | null; user_id: string };
    if (row.employer_id !== employerId) {
      return NextResponse.json({ error: "You can only dispute employment for your own company" }, { status: 403 });
    }

    const oldStatus = (rec as { verification_status?: string }).verification_status ?? "pending";

    const { error: updateErr } = await adminSupabase
      .from("employment_records")
      .update({ verification_status: "flagged", updated_at: new Date().toISOString() })
      .eq("id", parsed.data.record_id);

    if (updateErr) {
      console.error("[employer/dispute-employment]", updateErr);
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    await logAudit({
      entityType: "employment_record",
      entityId: parsed.data.record_id,
      changedBy: user.id,
      oldValue: { verification_status: oldStatus },
      newValue: { verification_status: "flagged", reason: parsed.data.reason ?? null },
      changeReason: parsed.data.reason ?? "Employer disputed employment",
    });

    const { triggerProfileIntelligence } = await import("@/lib/intelligence/engines");
    const { calculateUserIntelligence } = await import("@/lib/intelligence/calculateUserIntelligence");
    const { recalculateMatchConfidence } = await import("@/lib/employment/matchConfidence");
    triggerProfileIntelligence(row.user_id).catch(() => {});
    calculateUserIntelligence(row.user_id).catch(() => {});
    recalculateMatchConfidence(parsed.data.record_id).catch(() => {});

    const { triggerEmployerIntelligence } = await import("@/lib/intelligence/engines");
    triggerEmployerIntelligence(employerId).catch(() => {});

    await adminSupabase.from("employer_notifications").insert({
      employer_id: employerId,
      type: "employment_disputed",
      related_user_id: row.user_id,
      related_record_id: parsed.data.record_id,
      read: false,
    });

    return NextResponse.json({ success: true, verification_status: "flagged" });
  } catch (e) {
    console.error("[employer/dispute-employment]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
