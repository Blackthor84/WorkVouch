/**
 * POST /api/employer/confirm-employment
 * Employer confirms an employment record (sets verification_status to verified).
 * Logs to audit_logs; triggers profile + match confidence.
 */

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
import { getCurrentUser } from "@/lib/auth";
import { createServerSupabase } from "@/lib/supabase/server";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { hasRole } from "@/lib/auth";
import { logAudit } from "@/lib/dispute-audit";
import { z } from "zod";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  record_id: z.string().uuid(),
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
      return NextResponse.json({ error: "You can only confirm employment for your own company" }, { status: 403 });
    }

    const oldStatus = (rec as { verification_status?: string }).verification_status ?? "pending";

    const { error: updateErr } = await adminSupabase
      .from("employment_records")
      .update({
        verification_status: "verified",
        employer_confirmation_status: "approved",
        updated_at: new Date().toISOString(),
      })
      .eq("id", parsed.data.record_id);

    if (updateErr) {
      console.error("[employer/confirm-employment]", updateErr);
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    await logAudit({
      entityType: "employment_record",
      entityId: parsed.data.record_id,
      changedBy: user.id,
      oldValue: { verification_status: oldStatus },
      newValue: { verification_status: "verified" },
      changeReason: "Employer confirmed employment",
    });

    const { updateConfirmationLevel } = await import("@/lib/employment/confirmationLevel");
    try {
      await updateConfirmationLevel(parsed.data.record_id);
    } catch (err: unknown) {
      console.error("[API][confirm-employment] updateConfirmationLevel", { recordId: parsed.data.record_id, err });
    }

    const { triggerProfileIntelligence, triggerEmployerIntelligence } = await import("@/lib/intelligence/engines");
    const { calculateUserIntelligence } = await import("@/lib/intelligence/calculateUserIntelligence");
    const { recalculateMatchConfidence } = await import("@/lib/employment/matchConfidence");
    try {
      await triggerProfileIntelligence(row.user_id);
    } catch (err: unknown) {
      console.error("[API][confirm-employment] triggerProfileIntelligence", { userId: row.user_id, err });
    }
    try {
      await calculateUserIntelligence(row.user_id);
    } catch (err: unknown) {
      console.error("[API][confirm-employment] calculateUserIntelligence", { userId: row.user_id, err });
    }
    try {
      await recalculateMatchConfidence(parsed.data.record_id);
    } catch (err: unknown) {
      console.error("[API][confirm-employment] recalculateMatchConfidence", { recordId: parsed.data.record_id, err });
    }
    try {
      await triggerEmployerIntelligence(employerId);
    } catch (err: unknown) {
      console.error("[API][confirm-employment] triggerEmployerIntelligence", { employerId, err });
    }

    return NextResponse.json({ success: true, verification_status: "verified" });
  } catch (err: unknown) {
    console.error("[API][confirm-employment]", { err });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
