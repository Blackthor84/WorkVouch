/**
 * GET /api/employer/hiring-intelligence/summary
 * Aggregated hiring board data for the enterprise dashboard (employer-only).
 */

import { NextRequest, NextResponse } from "next/server";
import { admin } from "@/lib/supabase-admin";
import { getCurrentUser, getCurrentUserRole, isEmployer } from "@/lib/auth";
import { requireEmployerLegalAcceptanceOrResponse } from "@/lib/employer/requireEmployerLegalAcceptance";
import { requireActiveSubscription } from "@/lib/employer-require-active-subscription";
import type {
  HiringIntelligenceCandidate,
  PipelineStage,
  RiskLevel,
} from "@/lib/enterprise/hiringIntelligenceTypes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function riskFromTrustAndVerifications(
  trust: number | null,
  verifications: number
): RiskLevel {
  const t = trust ?? 0;
  if (t < 60 || verifications === 0) return "high";
  if (t < 80) return "medium";
  return "low";
}

function assignPipeline(args: {
  savedAt: string;
  trust: number | null;
  verificationCount: number;
  hired: boolean | null;
  dismissed: boolean;
}): PipelineStage {
  if (args.hired === true) return "hired";
  if (args.hired === false && !args.dismissed) return "rejected";
  if (args.verificationCount >= 2 && (args.trust ?? 0) >= 70) return "verified";
  const saved = new Date(args.savedAt).getTime();
  const week = 7 * 24 * 60 * 60 * 1000;
  if (Date.now() - saved <= week && (args.trust ?? 0) < 70 && args.verificationCount < 2) {
    return "new";
  }
  return "reviewing";
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    const userIsEmployer = await isEmployer();
    if (!user || !userIsEmployer) {
      return NextResponse.json({ error: "Forbidden: Employer access required" }, { status: 403 });
    }

    const disclaimerResponse = await requireEmployerLegalAcceptanceOrResponse(
      user.id,
      await getCurrentUserRole()
    );
    if (disclaimerResponse) return disclaimerResponse;

    const subCheck = await requireActiveSubscription(user.id);
    if (!subCheck.allowed) {
      return NextResponse.json(
        { error: subCheck.error ?? "Active subscription required." },
        { status: 403 }
      );
    }

    const rangeParam = request.nextUrl.searchParams.get("range");
    const rangeDays =
      rangeParam === "30" ? 30 : rangeParam === "90" ? 90 : 7;
    const since = new Date(Date.now() - rangeDays * 24 * 60 * 60 * 1000).toISOString();

    const [{ data: companyRow }, { data: savedRows, error: savedErr }, { data: outcomeRows }] =
      await Promise.all([
        admin.from("employer_accounts").select("company_name").eq("user_id", user.id).maybeSingle(),
        admin
          .from("saved_candidates")
          .select("candidate_id, saved_at")
          .eq("employer_id", user.id)
          .order("saved_at", { ascending: false }),
        admin
          .from("hiring_outcome_feedback")
          .select("candidate_id, hired, dismissed")
          .eq("employer_id", user.id),
      ]);

    if (savedErr) {
      console.error("[hiring-intelligence/summary] saved_candidates", savedErr);
      return NextResponse.json({ error: "Failed to load saved candidates" }, { status: 500 });
    }

    const companyName =
      (companyRow as { company_name?: string } | null)?.company_name ?? "Your company";

    const savedList = (savedRows ?? []) as { candidate_id: string; saved_at: string }[];
    const candidateIds = [...new Set(savedList.map((r) => r.candidate_id))];

    const outcomeMap = new Map<
      string,
      { hired: boolean | null; dismissed: boolean }
    >();
    ((outcomeRows ?? []) as { candidate_id: string; hired: boolean | null; dismissed: boolean }[]).forEach(
      (o) => {
        outcomeMap.set(o.candidate_id, { hired: o.hired, dismissed: Boolean(o.dismissed) });
      }
    );

    if (candidateIds.length === 0) {
      return NextResponse.json({
        companyName,
        rangeDays,
        candidates: [] as HiringIntelligenceCandidate[],
        metrics: {
          totalCandidates: 0,
          avgTrustScore: 0,
          highRiskPct: 0,
          verifiedPct: 0,
        },
        distribution: { highTrust: 0, mediumTrust: 0, lowTrust: 0 },
      });
    }

    const [{ data: profiles }, { data: trustRows }, { data: verRows }] = await Promise.all([
      admin
        .from("profiles")
        .select("id, full_name, industry, professional_summary")
        .in("id", candidateIds),
      admin.from("trust_scores").select("user_id, score").in("user_id", candidateIds),
      admin
        .from("verification_requests")
        .select("requester_profile_id")
        .in("requester_profile_id", candidateIds)
        .eq("status", "accepted"),
    ]);

    const profileById = Object.fromEntries(
      ((profiles ?? []) as { id: string; full_name: string; industry: string | null; professional_summary: string | null }[]).map(
        (p) => [p.id, p]
      )
    );

    const trustByUser = Object.fromEntries(
      ((trustRows ?? []) as { user_id: string; score: number }[]).map((t) => [
        t.user_id,
        Number(t.score),
      ])
    );

    const verificationCount: Record<string, number> = {};
    candidateIds.forEach((id) => {
      verificationCount[id] = 0;
    });
    ((verRows ?? []) as { requester_profile_id: string }[]).forEach((v) => {
      verificationCount[v.requester_profile_id] = (verificationCount[v.requester_profile_id] ?? 0) + 1;
    });

    const candidates: HiringIntelligenceCandidate[] = savedList.map((row) => {
      const profile = profileById[row.candidate_id];
      const trustScore = trustByUser[row.candidate_id] ?? null;
      const vc = verificationCount[row.candidate_id] ?? 0;
      const outcome = outcomeMap.get(row.candidate_id);
      const pipelineStage = assignPipeline({
        savedAt: row.saved_at,
        trust: trustScore,
        verificationCount: vc,
        hired: outcome?.hired ?? null,
        dismissed: outcome?.dismissed ?? false,
      });

      const summary = profile?.professional_summary?.trim() ?? null;
      const roleHint =
        summary && summary.length > 80 ? `${summary.slice(0, 77)}…` : summary;

      return {
        candidateId: row.candidate_id,
        savedAt: row.saved_at,
        fullName: profile?.full_name?.trim() || "Candidate",
        industry: profile?.industry ?? null,
        roleHint,
        trustScore,
        verificationCount: vc,
        pipelineStage,
        riskLevel: riskFromTrustAndVerifications(trustScore, vc),
      };
    });

    const inWindow = candidates.filter((c) => c.savedAt >= since);
    const pool = inWindow.length > 0 ? inWindow : candidates;

    const withTrust = pool.filter((c) => c.trustScore != null);
    const avgTrustScore =
      withTrust.length > 0
        ? Math.round(
            withTrust.reduce((a, c) => a + (c.trustScore as number), 0) / withTrust.length
          )
        : 0;

    const highRisk = pool.filter((c) => c.riskLevel === "high").length;
    const highRiskPct = pool.length > 0 ? Math.round((highRisk / pool.length) * 100) : 0;

    const verifiedCount = pool.filter((c) => c.pipelineStage === "verified" || c.pipelineStage === "hired").length;
    const verifiedPct = pool.length > 0 ? Math.round((verifiedCount / pool.length) * 100) : 0;

    const distribution = {
      highTrust: pool.filter((c) => (c.trustScore ?? 0) >= 80).length,
      mediumTrust: pool.filter((c) => {
        const t = c.trustScore ?? 0;
        return t >= 60 && t < 80;
      }).length,
      lowTrust: pool.filter((c) => (c.trustScore ?? 0) < 60).length,
    };

    return NextResponse.json({
      companyName,
      rangeDays,
      candidates,
      metrics: {
        totalCandidates: pool.length,
        avgTrustScore,
        highRiskPct,
        verifiedPct,
      },
      distribution,
    });
  } catch (e) {
    console.error("[hiring-intelligence/summary]", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
