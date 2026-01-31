import { NextResponse } from "next/server";
import { getCurrentUser, hasRole } from "@/lib/auth";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { generateComplianceAlerts } from "@/lib/security/complianceAlerts";

/**
 * POST /api/employer/generate-compliance-alerts
 * Security Agency only. Runs generateComplianceAlerts for the employer (e.g. from cron).
 */
export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const isEmployer = await hasRole("employer");
    if (!isEmployer) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const sb = getSupabaseServer() as any;
    const { data: ea } = await sb.from("employer_accounts").select("id, plan_tier").eq("user_id", user.id).single();
    const employerId = (ea as { id?: string } | null)?.id;
    const planTier = (ea as { plan_tier?: string } | null)?.plan_tier ?? "";
    const normalized = planTier.toLowerCase().replace(/-/g, "_");
    if (!employerId || (normalized !== "security_agency" && normalized !== "security_bundle")) {
      return NextResponse.json({ error: "Security Agency plan required" }, { status: 403 });
    }

    const result = await generateComplianceAlerts(employerId);
    return NextResponse.json({ ok: true, created: result.created });
  } catch (e) {
    console.error("Generate compliance alerts error:", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
