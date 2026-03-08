// IMPORTANT:
// All server routes must use the `admin` Supabase client.
// Do not use `supabase` in API routes.

import { NextResponse } from "next/server";

export const runtime = "nodejs";
import { getCurrentUser, hasRole } from "@/lib/auth";
import { admin } from "@/lib/supabase-admin";
/**
 * GET /api/employer/compliance-badge
 * Returns unresolved compliance alert count for Security Agency employers (for navbar badge).
 */
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const isEmployer = await hasRole("employer");
    if (!isEmployer) return NextResponse.json({ count: 0, planTier: null });
    const { data: ea } = await admin.from("employer_accounts").select("id, plan_tier").eq("user_id", user.id);
    const account = Array.isArray(ea) ? ea[0] : ea;
    if (!account?.id) return NextResponse.json({ count: 0, planTier: null });

    const planTier = (account as { plan_tier?: string }).plan_tier ?? null;
    const normalized = (planTier ?? "").toLowerCase().replace(/-/g, "_");
    if (normalized !== "custom" && normalized !== "enterprise" && normalized !== "security_agency" && normalized !== "security_bundle") {
      return NextResponse.json({ count: 0, planTier });
    }

    const { data: alerts } = await admin
      .from("compliance_alerts")
      .select("id")
      .eq("employer_id", account.id)
      .eq("resolved", false);
    const count = Array.isArray(alerts) ? alerts.length : 0;

    return NextResponse.json({ count, planTier });
  } catch (e) {
    return NextResponse.json({ count: 0, planTier: null });
  }
}
