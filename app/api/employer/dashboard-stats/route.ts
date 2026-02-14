/**
 * GET /api/employer/dashboard-stats
 * Workforce overview for employer dashboard: total verified, verification rate, dispute rate, rehire eligibility %.
 * Role-gated: employer only.
 */

import { NextResponse } from "next/server";

export const runtime = "nodejs";
import { getCurrentUser, hasRole } from "@/lib/auth";
import { getSupabaseServer } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!(await hasRole("employer"))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const supabase = getSupabaseServer() as unknown as {
      from: (table: string) => {
        select: (cols: string) => { eq: (col: string, val: string) => Promise<{ data: unknown; error: unknown }>; in: (col: string, vals: string[]) => Promise<{ data: unknown; error: unknown }> };
      };
    };

    const eaResult = await supabase.from("employer_accounts").select("id").eq("user_id", user.id);
    const ea = Array.isArray(eaResult.data) ? eaResult.data[0] : eaResult.data;
    if (eaResult.error || !ea) return NextResponse.json({ error: "Employer not found" }, { status: 404 });
    const employerId = (ea as { id: string }).id;

    const { data: employmentRows } = await supabase
      .from("employment_records")
      .select("id, user_id, employer_confirmation_status, verification_status")
      .eq("employer_id", employerId);
    const employmentList = Array.isArray(employmentRows) ? employmentRows : [];
    const totalVerified = employmentList.filter(
      (r: { employer_confirmation_status?: string; verification_status?: string }) =>
        (r as { employer_confirmation_status?: string }).employer_confirmation_status === "approved" ||
        (r as { verification_status?: string }).verification_status === "verified"
    ).length;

    const employmentIds = employmentList.map((r: { id: string }) => (r as { id: string }).id);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const iso30 = thirtyDaysAgo.toISOString();

    let verificationCompletionRate: number | null = null;
    const { count: requested } = await (supabase as any)
      .from("verification_requests")
      .select("id", { count: "exact", head: true })
      .eq("requested_by_id", employerId)
      .gte("created_at", iso30);
    const req = requested ?? 0;
    if (req > 0) {
      const { count: completed } = await (supabase as any)
        .from("verification_requests")
        .select("id", { count: "exact", head: true })
        .eq("requested_by_id", employerId)
        .in("status", ["approved", "verified"])
        .gte("updated_at", iso30);
      verificationCompletionRate = Math.round(((completed ?? 0) / req) * 100);
    }

    let disputeRate: number | null = null;
    if (employmentIds.length > 0) {
      const { data: disputes } = await (supabase as any)
        .from("disputes")
        .select("id")
        .in("related_record_id", employmentIds);
      const disputeCount = Array.isArray(disputes) ? disputes.length : 0;
      disputeRate = employmentList.length > 0 ? Math.round((disputeCount / employmentList.length) * 100) : 0;
    }

    let rehireEligibilityPct: number | null = null;
    const { data: rehireRows } = await supabase.from("rehire_registry").select("id, rehire_eligible").eq("employer_id", employerId);
    const rehireList = Array.isArray(rehireRows) ? rehireRows : [];
    if (rehireList.length > 0) {
      const eligible = rehireList.filter((r: { rehire_eligible?: boolean }) => (r as { rehire_eligible?: boolean }).rehire_eligible === true).length;
      rehireEligibilityPct = Math.round((eligible / rehireList.length) * 100);
    }

    return NextResponse.json({
      totalVerified,
      verificationCompletionRate,
      disputeRate,
      rehireEligibilityPct,
    });
  } catch (e) {
    console.error("[employer/dashboard-stats]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
