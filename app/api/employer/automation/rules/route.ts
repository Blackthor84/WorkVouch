/**
 * GET /api/employer/automation/rules — list automation rules
 * POST /api/employer/automation/rules — create rule
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isEmployer } from "@/lib/auth";
import { requireEmployerLegalAcceptanceOrResponse } from "@/lib/employer/requireEmployerLegalAcceptance";
import { requireActiveSubscription } from "@/lib/employer-require-active-subscription";
import { getCurrentUserRole } from "@/lib/auth";
import { getSupabaseServer } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RULE_TYPES = ["candidate_meets_policy", "candidate_trust_risk", "employee_trust_risk", "verification_expiring", "credential_shared"] as const;
const NOTIFICATION_TYPES = ["send_notification", "create_dashboard_alert", "log_trust_event"] as const;

export async function GET(_req: NextRequest) {
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

    const supabase = getSupabaseServer();
    const { data, error } = await supabase
      .from("trust_automation_rules")
      .select("id, employer_id, rule_name, rule_type, rule_conditions, notification_type, created_at")
      .eq("employer_id", user.id)
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ rules: data ?? [] });
  } catch (e) {
    console.error("[employer/automation/rules GET]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
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

    const body = await req.json();
    const rule_name = typeof body.rule_name === "string" ? body.rule_name.trim() : "";
    const rule_type = RULE_TYPES.includes(body.rule_type) ? body.rule_type : "candidate_meets_policy";
    const rule_conditions =
      body.rule_conditions && typeof body.rule_conditions === "object"
        ? body.rule_conditions
        : {};
    const notification_type = NOTIFICATION_TYPES.includes(body.notification_type)
      ? body.notification_type
      : "create_dashboard_alert";

    if (!rule_name) {
      return NextResponse.json({ error: "rule_name is required" }, { status: 400 });
    }

    const supabase = getSupabaseServer();
    const { data, error } = await supabase
      .from("trust_automation_rules")
      .insert({
        employer_id: user.id,
        rule_name,
        rule_type,
        rule_conditions,
        notification_type,
      })
      .select("id, employer_id, rule_name, rule_type, rule_conditions, notification_type, created_at")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ rule: data });
  } catch (e) {
    console.error("[employer/automation/rules POST]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
