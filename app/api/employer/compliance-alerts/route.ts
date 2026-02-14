import { NextResponse } from "next/server";

export const runtime = "nodejs";
import { getCurrentUser, hasRole } from "@/lib/auth";
import { getSupabaseServer } from "@/lib/supabase/admin";

/**
 * GET /api/employer/compliance-alerts
 * Security Agency only. Returns unresolved compliance alerts for the employer.
 */
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const isEmployer = await hasRole("employer");
    if (!isEmployer) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const sb = getSupabaseServer() as any;
    const { data: ea } = await sb.from("employer_accounts").select("id, plan_tier").eq("user_id", user.id).single();
    const employerId = (ea as { id?: string; plan_tier?: string } | null)?.id;
    const planTier = (ea as { plan_tier?: string } | null)?.plan_tier ?? "";
    const normalized = planTier.toLowerCase().replace(/-/g, "_");
    if (!employerId || (normalized !== "security_agency" && normalized !== "security_bundle")) {
      return NextResponse.json({ error: "Security Agency plan required" }, { status: 403 });
    }

    const { data: alerts } = await sb
      .from("compliance_alerts")
      .select("id, user_id, license_id, alert_type, resolved, created_at")
      .eq("employer_id", employerId)
      .eq("resolved", false)
      .order("created_at", { ascending: false });
    const list = (alerts ?? []) as { id: string; user_id: string | null; license_id: string | null; alert_type: string; created_at: string }[];

    return NextResponse.json({ data: list });
  } catch (e) {
    console.error("Compliance alerts error:", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
