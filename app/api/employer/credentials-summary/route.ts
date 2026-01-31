import { NextResponse } from "next/server";
import { getCurrentUser, hasRole } from "@/lib/auth";
import { getSupabaseServer } from "@/lib/supabase/admin";

/**
 * GET /api/employer/credentials-summary
 * Universal credential counts for dashboard: active, expiring, expired, renewals.
 * Compliance alert count returned for plan-gating on frontend (security_agency shows compliance).
 */
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const isEmployer = await hasRole("employer");
    if (!isEmployer) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const sb = getSupabaseServer() as any;
    const { data: ea } = await sb.from("employer_accounts").select("id, plan_tier").eq("user_id", user.id);
    const account = Array.isArray(ea) ? ea[0] : ea;
    if (!account?.id) return NextResponse.json({ error: "Employer not found" }, { status: 404 });
    const employerId = (account as { id: string }).id;
    const planTier = (account as { plan_tier?: string }).plan_tier ?? null;

    const today = new Date().toISOString().slice(0, 10);
    const in30 = new Date();
    in30.setDate(in30.getDate() + 30);
    const in30Str = in30.toISOString().slice(0, 10);

    let activeCertifications = 0;
    let expiringCertifications = 0;
    let expiredCount = 0;
    let renewalsNeeded = 0;
    try {
      const { data: creds } = await sb
        .from("professional_credentials")
        .select("id, status, expiration_date")
        .eq("employer_id", employerId);
      const list = (creds ?? []) as { status: string; expiration_date: string | null }[];
      for (const c of list) {
        if (c.status === "suspended") continue;
        if (c.expiration_date) {
          if (c.expiration_date < today) {
            expiredCount++;
          } else if (c.expiration_date <= in30Str) {
            expiringCertifications++;
            renewalsNeeded++;
          }
        }
        if (c.status === "active" || (c.expiration_date && c.expiration_date >= today)) {
          activeCertifications++;
        }
      }
    } catch {
      // professional_credentials may not exist
    }

    let complianceAlertCount = 0;
    const complianceDashboardEnabled =
      planTier === "security_agency" || planTier === "security_bundle" || planTier === "security-bundle";
    if (complianceDashboardEnabled) {
      try {
        const { data: alerts } = await sb
          .from("compliance_alerts")
          .select("id")
          .eq("employer_id", employerId)
          .eq("resolved", false);
        complianceAlertCount = Array.isArray(alerts) ? alerts.length : 0;
      } catch {
        // ignore
      }
    }

    return NextResponse.json({
      activeCertifications,
      expiringCertifications,
      expiredCount,
      renewalsNeeded,
      complianceAlertCount: complianceDashboardEnabled ? complianceAlertCount : 0,
      complianceDashboardEnabled,
    });
  } catch (e) {
    console.error("Credentials summary error:", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
