// IMPORTANT:
// All server routes must use the `admin` Supabase client.
// Do not use `supabase` in API routes.

/**
 * GET /api/employer/candidate/[id]/employment-verification
 * Employer-only. Returns candidate employment records with verification status.
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isEmployer } from "@/lib/auth";
import { requireEmployerLegalAcceptanceOrResponse } from "@/lib/employer/requireEmployerLegalAcceptance";
import { requireActiveSubscription } from "@/lib/employer-require-active-subscription";
import { getCurrentUserRole } from "@/lib/auth";
import { admin } from "@/lib/supabase-admin";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export type EmploymentVerificationEntry = {
  id: string;
  company_name: string;
  job_title: string;
  start_date: string;
  end_date: string | null;
  is_current: boolean;
  verification_status: string;
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !(await isEmployer())) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const disclaimer = await requireEmployerLegalAcceptanceOrResponse(user.id, await getCurrentUserRole());
    if (disclaimer) return disclaimer;
    const sub = await requireActiveSubscription(user.id);
    if (!sub.allowed) {
      return NextResponse.json({ error: sub.error ?? "Subscription required" }, { status: 403 });
    }
    const { id: candidateId } = await params;
    if (!candidateId) {
      return NextResponse.json({ error: "Missing candidate id" }, { status: 400 });
    }
    const { data: rows, error } = await admin.from("employment_records")
      .select("id, company_name, job_title, start_date, end_date, is_current, verification_status")
      .eq("user_id", candidateId)
      .order("start_date", { ascending: false })
      .limit(50);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    const entries = (rows ?? []) as EmploymentVerificationEntry[];
    return NextResponse.json({ entries });
  } catch (e) {
    console.error("[employer/candidate/employment-verification]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
