// IMPORTANT:
// All server routes must use the `admin` Supabase client.
// Do not use `supabase` in API routes.

/**
 * GET /api/employer/automation/alerts — list recent trust alerts for employer
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isEmployer } from "@/lib/auth";
import { requireEmployerLegalAcceptanceOrResponse } from "@/lib/employer/requireEmployerLegalAcceptance";
import { requireActiveSubscription } from "@/lib/employer-require-active-subscription";
import { getCurrentUserRole } from "@/lib/auth";
import { admin } from "@/lib/supabase-admin";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_LIMIT = 50;

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !(await isEmployer())) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const disclaimer = await requireEmployerLegalAcceptanceOrResponse(
      user.id,
      await getCurrentUserRole()
    );
    if (disclaimer) return disclaimer;
    const sub = await requireActiveSubscription(user.id);
    if (!sub.allowed) {
      return NextResponse.json({ error: sub.error ?? "Subscription required" }, { status: 403 });
    }

    const limit = Math.min(100, Math.max(1, Number(req.nextUrl.searchParams.get("limit")) || DEFAULT_LIMIT));
    const { data, error } = await admin.from("trust_alerts")
      .select("id, employer_id, candidate_id, alert_type, alert_message, rule_id, created_at")
      .eq("employer_id", user.id)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ alerts: data ?? [] });
  } catch (e) {
    console.error("[employer/automation/alerts GET]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
