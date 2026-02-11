import { NextResponse } from "next/server";
import { getCurrentUser, hasRole } from "@/lib/auth";
import { getSupabaseServer } from "@/lib/supabase/admin";

/**
 * GET /api/employer/security-summary
 * Security Agency Dashboard: expiring licenses, high-risk count, pending verifications, internal notes count.
 */
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const isEmployer = await hasRole("employer");
    if (!isEmployer) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const sb = getSupabaseServer() as any;
    const { data: ea } = await sb.from("employer_accounts").select("id").eq("user_id", user.id);
    const employerId = (Array.isArray(ea) ? ea[0] : ea) as { id?: string } | null;
    if (!employerId?.id) return NextResponse.json({ error: "Employer not found" }, { status: 404 });
    const eid = employerId.id;

    const today = new Date().toISOString().slice(0, 10);
    const expiringIn30 = new Date();
    expiringIn30.setDate(expiringIn30.getDate() + 30);
    const expiringDateStr = expiringIn30.toISOString().slice(0, 10);

    let totalActiveLicenses = 0;
    let expiringLicensesCount = 0;
    let expiredLicensesCount = 0;
    let suspendedLicensesCount = 0;
    try {
      const { data: gl } = await sb.from("guard_licenses").select("id, status, expiration_date").eq("employer_id", eid);
      const glList = (gl ?? []) as { status: string; expiration_date: string | null }[];
      for (const l of glList) {
        if (l.status === "suspended") suspendedLicensesCount++;
        else if (l.expiration_date && l.expiration_date < today) expiredLicensesCount++;
        else if (l.expiration_date && l.expiration_date <= expiringDateStr) expiringLicensesCount++;
        if (l.status === "active" || (l.expiration_date && l.expiration_date >= today && l.status !== "suspended")) totalActiveLicenses++;
      }
    } catch {
      // guard_licenses may not exist
    }

    let highRiskEmployeesCount = 0;
    let topCredentialScores: { user_id: string; full_name: string | null; guard_credential_score: number }[] = [];
    try {
      const { data: vrList } = await sb.from("verification_requests").select("job_id").eq("requested_by_id", eid);
      const jobIds = (vrList ?? []).map((r: { job_id: string }) => r.job_id);
      if (jobIds.length > 0) {
        const { data: jobs } = await sb.from("jobs").select("user_id").in("id", jobIds);
        const userIds = [...new Set((jobs ?? []).map((j: { user_id?: string }) => j.user_id).filter(Boolean))] as string[];
        if (userIds.length > 0) {
          const { data: prof } = await sb.from("profiles").select("id, full_name, risk_score, guard_credential_score").in("id", userIds);
          const profList = (prof ?? []) as { id: string; full_name: string | null; risk_score: number | null; guard_credential_score: number | null }[];
          highRiskEmployeesCount = profList.filter((p) => (p.guard_credential_score != null ? p.guard_credential_score < 50 : (p.risk_score ?? 100) < 50)).length;
          topCredentialScores = profList
            .filter((p) => p.guard_credential_score != null)
            .sort((a, b) => (b.guard_credential_score ?? 0) - (a.guard_credential_score ?? 0))
            .slice(0, 5)
            .map((p) => ({ user_id: p.id, full_name: p.full_name, guard_credential_score: p.guard_credential_score ?? 0 }));
        }
      }
    } catch {
      // columns may not exist
    }

    let expiredAlertsCount = 0;
    let warning30DayCount = 0;
    try {
      const { data: alerts } = await sb.from("compliance_alerts").select("id, alert_type").eq("employer_id", eid).eq("resolved", false);
      const alertList = (alerts ?? []) as { alert_type: string }[];
      expiredAlertsCount = alertList.filter((a) => a.alert_type === "expired").length;
      warning30DayCount = alertList.filter((a) => a.alert_type === "30_day_warning").length;
    } catch {
      // compliance_alerts may not exist
    }

    let pendingVerificationsCount = 0;
    try {
      const { data: pending } = await sb
        .from("verification_requests")
        .select("id")
        .eq("requested_by_id", eid)
        .eq("status", "pending");
      pendingVerificationsCount = Array.isArray(pending) ? pending.length : 0;
    } catch {
      // ignore
    }

    let internalNotesCount = 0;
    try {
      const { data: rr } = await sb
        .from("rehire_registry")
        .select("id")
        .eq("employer_id", eid)
        .not("internal_notes", "is", null);
      internalNotesCount = Array.isArray(rr) ? rr.length : 0;
    } catch {
      // ignore
    }

    let reportsUsed = 0;
    let reportsLimit = 80;
    try {
      const usageMod = await import("@/lib/usage");
      const usage = await usageMod.getUsageForEmployer(eid);
      if (usage) {
        reportsUsed = usage.reportsUsed;
        reportsLimit = usage.limits?.reports === -1 ? 999 : usage.limits?.reports ?? 80;
      }
    } catch (err: unknown) {
      console.error("[API][security-summary] getUsageForEmployer", { eid, err });
    }

    return NextResponse.json({
      expiringLicensesCount,
      highRiskEmployeesCount,
      pendingVerificationsCount,
      internalNotesCount,
      totalActiveLicenses,
      expiredLicensesCount,
      suspendedLicensesCount,
      expiredAlertsCount,
      warning30DayCount,
      topCredentialScores,
      reportsUsed,
      reportsLimit,
    });
  } catch (e) {
    console.error("Security summary error:", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
