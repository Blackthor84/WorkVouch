import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
import { getCurrentUser, hasRole } from "@/lib/auth";
import { createServerSupabase } from "@/lib/supabase/server";
import { checkFeatureAccess } from "@/lib/feature-flags";
import {
  computeInsights,
  getCachedInsights,
  setCachedInsights,
  toEmployerTier,
  type WorkVouchInsightsPayload,
  type EmployerTier,
} from "@/lib/workvouch-insights";

/**
 * GET /api/employer/insights?candidateId=<id>
 * Returns WorkVouch Insights (reference_consistency, stability_index, environment_fit_indicator)
 * trimmed by employer subscription tier. Only returns data when feature is enabled and role is employer.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const isEmployer = await hasRole("employer");
    if (!isEmployer) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const candidateId = searchParams.get("candidateId");
    if (!candidateId) {
      return NextResponse.json({ error: "Missing candidateId" }, { status: 400 });
    }

    const supabase = await createServerSupabase();
    const supabaseAny = supabase as any;

    const { data: employerAccount } = await supabaseAny
      .from("employer_accounts")
      .select("id, plan_tier")
      .eq("user_id", user.id)
      .single();
    if (!employerAccount) {
      return NextResponse.json({ error: "Employer account not found" }, { status: 404 });
    }
    const employerId = employerAccount.id;
    const planTier = employerAccount.plan_tier ?? "free";
    const tier: EmployerTier = toEmployerTier(planTier);

    const [refAccess, stabAccess, envAccess] = await Promise.all([
      checkFeatureAccess("reference_consistency", { userId: user.id, employerId, uiOnly: true }),
      checkFeatureAccess("stability_index", { userId: user.id, employerId, uiOnly: true }),
      checkFeatureAccess("environment_fit_indicator", { userId: user.id, employerId, uiOnly: true }),
    ]);

    if (!refAccess && !stabAccess && !envAccess) {
      return NextResponse.json({
        reference_consistency: null,
        stability_index: null,
        environment_fit_indicator: null,
        tier,
      });
    }

    let payload: WorkVouchInsightsPayload | null = getCachedInsights(candidateId);
    if (!payload) {
      const { data: references } = await supabaseAny
        .from("user_references")
        .select("id, rating, job_id")
        .eq("to_user_id", candidateId)
        .eq("is_deleted", false);
      const { data: jobs } = await supabaseAny
        .from("jobs")
        .select("id, start_date, end_date")
        .eq("user_id", candidateId)
        .order("start_date", { ascending: false });
      const jobsList = jobs || [];
      const refsList = references || [];
      const jobIds = new Set((jobsList as { id?: string }[]).map((j) => j.id).filter(Boolean));
      const jobsWithRefs = new Set((refsList as { job_id?: string }[]).map((r) => r.job_id).filter((id) => jobIds.has(id)));
      const peerConfirmedPct =
        jobsList.length > 0
          ? Math.round((jobsWithRefs.size / jobsList.length) * 100)
          : 0;
      payload = computeInsights({
        references: refsList,
        jobs: jobsList,
        peerConfirmedPct,
      });
      setCachedInsights(candidateId, payload);
    }

    const out: Record<string, unknown> = { tier };

    if (stabAccess) {
      const stab = payload.stability_index;
      if (tier === "emp_lite" && stab) {
        out.stability_index = {
          level: stab.level,
          summary: stab.summary,
          sufficientData: stab.sufficientData,
        };
      } else if (stab) {
        out.stability_index = stab;
      } else {
        out.stability_index = null;
      }
    } else {
      out.stability_index = null;
    }

    if (refAccess) {
      const ref = payload.reference_consistency;
      if (tier === "emp_pro" && ref) {
        out.reference_consistency = {
          label: ref.label,
          referenceCount: ref.referenceCount,
          sufficientData: ref.sufficientData,
        };
      } else if (tier === "emp_enterprise" && ref) {
        out.reference_consistency = ref;
      } else if (ref) {
        out.reference_consistency = {
          label: ref.label,
          referenceCount: ref.referenceCount,
          sufficientData: ref.sufficientData,
        };
      } else {
        out.reference_consistency = null;
      }
    } else {
      out.reference_consistency = null;
    }

    if (envAccess) {
      const env = payload.environment_fit_indicator;
      if (tier === "emp_lite") {
        out.environment_fit_indicator = null;
      } else if (tier === "emp_pro" && env) {
        out.environment_fit_indicator = {
          bestFit: { environment: env.bestFit.environment },
          secondaryFit: env.secondaryFit ? { environment: env.secondaryFit.environment } : null,
          sufficientData: env.sufficientData,
        };
      } else if (tier === "emp_enterprise" && env) {
        out.environment_fit_indicator = env;
      } else {
        out.environment_fit_indicator = env ?? null;
      }
    } else {
      out.environment_fit_indicator = null;
    }

    return NextResponse.json(out);
  } catch (e) {
    console.error("Employer insights error:", e);
    return NextResponse.json(
      { error: "Failed to load insights" },
      { status: 500 }
    );
  }
}
