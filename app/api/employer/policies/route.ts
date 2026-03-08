// IMPORTANT:
// All server routes must use the `admin` Supabase client.
// Do not use `supabase` in API routes.

/**
 * POST /api/employer/policies — create policy
 * GET /api/employer/policies — list employer's trust policies
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isEmployer } from "@/lib/auth";
import { requireEmployerLegalAcceptanceOrResponse } from "@/lib/employer/requireEmployerLegalAcceptance";
import { requireActiveSubscription } from "@/lib/employer-require-active-subscription";
import { getCurrentUserRole } from "@/lib/auth";
import { admin } from "@/lib/supabase-admin";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
    const { data, error } = await admin.from("trust_policies")
      .select("id, employer_id, policy_name, min_trust_score, min_verification_coverage, required_reference_type, min_trust_graph_depth, allow_recent_disputes, created_at")
      .eq("employer_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ policies: data ?? [] });
  } catch (e) {
    console.error("[employer/policies GET]", e);
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
    const policy_name =
      typeof body.policy_name === "string" ? body.policy_name.trim() : "";
    const min_trust_score =
      typeof body.min_trust_score === "number"
        ? Math.max(0, Math.min(100, Math.round(body.min_trust_score)))
        : 0;
    const min_verification_coverage =
      typeof body.min_verification_coverage === "number"
        ? Math.max(0, Math.min(100, Math.round(body.min_verification_coverage)))
        : 0;
    const required_reference_type =
      typeof body.required_reference_type === "string"
        ? body.required_reference_type.trim() || null
        : null;
    const min_trust_graph_depth =
      typeof body.min_trust_graph_depth === "string"
        ? body.min_trust_graph_depth.trim() || null
        : null;
    const allow_recent_disputes = Boolean(body.allow_recent_disputes);

    if (!policy_name) {
      return NextResponse.json(
        { error: "policy_name is required" },
        { status: 400 }
      );
    }
    const { data, error } = await admin.from("trust_policies")
      .insert({
        employer_id: user.id,
        policy_name,
        min_trust_score,
        min_verification_coverage,
        required_reference_type,
        min_trust_graph_depth,
        allow_recent_disputes,
      })
      .select("id, employer_id, policy_name, min_trust_score, min_verification_coverage, required_reference_type, min_trust_graph_depth, allow_recent_disputes, created_at")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ policy: data });
  } catch (e) {
    console.error("[employer/policies POST]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
