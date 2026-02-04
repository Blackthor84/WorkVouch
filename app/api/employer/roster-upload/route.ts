/**
 * POST /api/employer/roster-upload
 * Bulk roster upload (Pro/Custom tiers). Body: { rows: [{ employee_name, employee_email?, role?, start_date?, end_date? }] }.
 * When uploaded: match existing accounts by email; auto-confirm employment if employer verified; notify employee; trigger intelligence.
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { hasRole } from "@/lib/auth";
import { createServerSupabase } from "@/lib/supabase/server";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { z } from "zod";

export const dynamic = "force-dynamic";

const rowSchema = z.object({
  employee_name: z.string().min(1).max(500),
  employee_email: z.string().email().optional().nullable(),
  role: z.string().max(500).optional().nullable(),
  start_date: z.string().optional().nullable(),
  end_date: z.string().optional().nullable(),
});

const bodySchema = z.object({
  rows: z.array(rowSchema).min(1).max(500),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!(await hasRole("employer"))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const supabase = await createServerSupabase();
    const supabaseAny = supabase as any;
    const adminSupabase = getSupabaseServer() as any;

    const { data: account } = await supabaseAny
      .from("employer_accounts")
      .select("id, company_name, plan_tier")
      .eq("user_id", user.id)
      .single();
    if (!account) return NextResponse.json({ error: "Employer not found" }, { status: 404 });
    const employerId = (account as { id: string }).id;
    const planTier = ((account as { plan_tier?: string }).plan_tier ?? "free").toLowerCase();
    if (planTier !== "pro" && planTier !== "enterprise" && planTier !== "custom") {
      return NextResponse.json({ error: "Roster upload is available on Pro, Enterprise, or Custom plans only" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const batchId = crypto.randomUUID();
    const companyName = (account as { company_name?: string }).company_name ?? "";
    const inserted: { id: string; status: string; matched_user_id?: string }[] = [];

    for (const row of parsed.data.rows) {
      const rec = {
        employer_id: employerId,
        uploaded_by: user.id,
        upload_batch_id: batchId,
        employee_name: row.employee_name,
        employee_email: row.employee_email ?? null,
        role: row.role ?? null,
        start_date: row.start_date ?? null,
        end_date: row.end_date ?? null,
        status: "pending" as const,
      };

      const { data: rosterRow, error: insertErr } = await adminSupabase
        .from("employer_roster_upload")
        .insert(rec)
        .select("id")
        .single();

      if (insertErr) {
        console.error("[roster-upload] insert", insertErr);
        continue;
      }

      const rosterId = (rosterRow as { id: string }).id;
      let matchedUserId: string | null = null;

      if (row.employee_email) {
        const { data: profile } = await adminSupabase
          .from("profiles")
          .select("id")
          .eq("email", row.employee_email.trim().toLowerCase())
          .maybeSingle();
        if (profile) matchedUserId = (profile as { id: string }).id;
      }

      if (matchedUserId) {
        const { data: existingRecord } = await adminSupabase
          .from("employment_records")
          .select("id, verification_status, employer_id")
          .eq("user_id", matchedUserId)
          .ilike("company_normalized", companyName.trim().toLowerCase().replace(/[^\w\s]/g, " "))
          .maybeSingle();

        if (existingRecord) {
          const er = existingRecord as { id: string; employer_id: string | null; verification_status?: string };
          if (er.employer_id === employerId || !er.employer_id) {
            await adminSupabase
              .from("employment_records")
              .update({
                employer_id: employerId,
                verification_status: "verified",
                employer_confirmation_status: "approved",
                updated_at: new Date().toISOString(),
              })
              .eq("id", er.id);

            await adminSupabase.from("employer_roster_upload").update({ status: "confirmed" }).eq("id", rosterId);

            await adminSupabase.from("employer_notifications").insert({
              employer_id: employerId,
              type: "roster_matched_confirmed",
              related_user_id: matchedUserId,
              related_record_id: er.id,
              read: false,
            });

            const { triggerProfileIntelligence } = await import("@/lib/intelligence/engines");
            const { calculateUserIntelligence } = await import("@/lib/intelligence/calculateUserIntelligence");
            const { updateConfirmationLevel } = await import("@/lib/employment/confirmationLevel");
            triggerProfileIntelligence(matchedUserId).catch(() => {});
            calculateUserIntelligence(matchedUserId).catch(() => {});
            updateConfirmationLevel(er.id).catch(() => {});
          } else {
            await adminSupabase.from("employer_roster_upload").update({ status: "matched" }).eq("id", rosterId);
          }
        } else {
          await adminSupabase.from("employer_roster_upload").update({ status: "matched" }).eq("id", rosterId);
        }
      }

      inserted.push({
        id: rosterId,
        status: matchedUserId ? "confirmed" : "pending",
        matched_user_id: matchedUserId ?? undefined,
      });
    }

    const { triggerEmployerIntelligence } = await import("@/lib/intelligence/engines");
    triggerEmployerIntelligence(employerId).catch(() => {});

    return NextResponse.json({
      success: true,
      upload_batch_id: batchId,
      rows_uploaded: inserted.length,
      rows: inserted,
    });
  } catch (e) {
    console.error("[employer/roster-upload]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
