"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useTrustEngine } from "@/lib/trust/useTrustEngine";
import type { Industry } from "@/lib/industries";
import type { TrustScenarioPayload } from "@/lib/trust/types";
import { INDUSTRY_PROFILES } from "@/lib/trust/types";
import { SmartInsight } from "@/components/guidance/SmartInsight";
import { SuggestedActions } from "@/components/guidance/SuggestedActions";
import { TrustScoreHint, ConfidenceHint, RiskHint } from "@/components/guidance/TrustMetricHints";
import {
  improvementHints,
  whyOutcomeLines,
} from "@/lib/guidance/hiringGuidanceLogic";

type Props = {
  candidateId: string;
  initial: {
    fullName: string;
    industryLabel: string | null;
    roleHint: string | null;
    trustScore: number | null;
    referenceCount: number | null;
    jobCount: number | null;
  };
};

function mapIndustryKey(raw: string | null): Industry {
  const k = (raw ?? "").toLowerCase().replace(/\s+/g, "_");
  const keys = Object.keys(INDUSTRY_PROFILES) as Industry[];
  if (keys.includes(k as Industry)) return k as Industry;
  if (k.includes("health")) return "healthcare";
  if (k.includes("retail")) return "retail";
  if (k.includes("education")) return "education";
  if (k.includes("construction")) return "construction";
  if (k.includes("hospitality")) return "hospitality";
  if (k.includes("warehouse") || k.includes("logistics")) return "warehouse_logistics";
  if (k.includes("security")) return "security";
  return "healthcare";
}

function riskLabel(trust: number, confidence: number): "Low" | "Medium" | "High" {
  if (trust >= 80 && confidence >= 60) return "Low";
  if (trust < 55 || confidence < 35) return "High";
  return "Medium";
}

export default function EnterpriseSimulateClient({ candidateId, initial }: Props) {
  const { state, derived, engineAction, getEngineResult } = useTrustEngine();
  const [confidenceLabel, setConfidenceLabel] = useState<string>("—");
  const [keyInsights, setKeyInsights] = useState<string[]>([]);
  const [bootstrapped, setBootstrapped] = useState(false);
  const [simBlocked, setSimBlocked] = useState(false);
  const [simBlockMessage, setSimBlockMessage] = useState<string | null>(null);
  const [entitlementsLoading, setEntitlementsLoading] = useState(true);
  const bootstrapStarted = useRef(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/employer/confidence/${candidateId}`, { credentials: "include" });
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (res.ok && data?.locked) {
          setConfidenceLabel("—");
          setKeyInsights([typeof data?.message === "string" ? data.message : "Upgrade for full hiring confidence detail."]);
          return;
        }
        if (res.ok && data?.confidenceLevel) {
          setConfidenceLabel(String(data.confidenceLevel));
          const lines: string[] = [];
          (data.positives as string[] | undefined)?.slice(0, 3).forEach((p) => lines.push(p));
          (data.cautions as string[] | undefined)?.slice(0, 2).forEach((c) => lines.push(c));
          setKeyInsights(lines.length ? lines : ["Verified signals support this profile"]);
        } else {
          setConfidenceLabel("MEDIUM");
          setKeyInsights(["Review verification coverage on the candidate profile"]);
        }
      } catch {
        if (!cancelled) {
          setConfidenceLabel("MEDIUM");
          setKeyInsights(["Review verification coverage on the candidate profile"]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [candidateId]);

  useEffect(() => {
    if (bootstrapped) return;
    let cancelled = false;

    (async () => {
      setEntitlementsLoading(true);
      try {
        const entRes = await fetch("/api/employer/entitlements", { credentials: "include" });
        const ent = await entRes.json().catch(() => ({}));
        if (cancelled) return;

        if (!entRes.ok) {
          setSimBlocked(true);
          setSimBlockMessage(typeof ent?.error === "string" ? ent.error : "Could not verify your plan.");
          setEntitlementsLoading(false);
          return;
        }

        const limited = Boolean(ent?.limitedPreview);
        const remaining = typeof ent?.simulationRemaining === "number" ? ent.simulationRemaining : null;

        if (limited && remaining === 0) {
          setSimBlocked(true);
          setSimBlockMessage("You've reached your free limit — upgrade to continue running full hiring simulations.");
          setEntitlementsLoading(false);
          return;
        }

        const consumeRes = await fetch("/api/employer/simulation/consume", {
          method: "POST",
          credentials: "include",
        });
        const consumeJson = await consumeRes.json().catch(() => ({}));
        if (cancelled) return;

        if (!consumeRes.ok) {
          setSimBlocked(true);
          setSimBlockMessage(
            typeof consumeJson?.error === "string"
              ? consumeJson.error
              : "Simulation limit reached. Upgrade to continue."
          );
          setEntitlementsLoading(false);
          return;
        }

        const industry = mapIndustryKey(initial.industryLabel);
        const targetTrust = Math.min(100, Math.max(0, Math.round(initial.trustScore ?? 62)));
        const payload: TrustScenarioPayload = {
          scenarioId: "enterprise-baseline",
          title: "Baseline hiring insight",
          summary: "Aligned to current profile signals",
          before: { trustScore: 50, profileStrength: 50 },
          after: { trustScore: targetTrust, profileStrength: 65 },
          events: [
            {
              type: "verification",
              message: "Baseline verification mix applied",
              impact: 0,
            },
          ],
        };
        engineAction({ type: "setActorMode", actor: "employer" });
        engineAction({ type: "setEmployerMode", mode: "enterprise" });
        engineAction({ type: "setIndustry", industry });
        engineAction({ type: "setView", view: "employer" });
        engineAction({ type: "runScenario", payload });
        setBootstrapped(true);
      } catch {
        if (!cancelled) {
          setSimBlocked(true);
          setSimBlockMessage("Could not start hiring simulation.");
        }
      } finally {
        if (!cancelled) setEntitlementsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [bootstrapped, engineAction, initial.industryLabel, initial.trustScore, candidateId]);

  const engineResult = getEngineResult();

  const rl = riskLabel(state.trustScore, state.confidenceScore);

  const gapsFlagged = useMemo(
    () =>
      state.ledger.some(
        (e) =>
          String(e.action).includes("flagInconsistency") ||
          String(e.action).includes("flag") ||
          (e.reason && String(e.reason).toLowerCase().includes("gap"))
      ),
    [state.ledger]
  );

  const whyLines = useMemo(
    () =>
      whyOutcomeLines({
        trust: state.trustScore,
        confidencePct: state.confidenceScore,
        referenceCount: initial.referenceCount ?? 0,
        jobCount: initial.jobCount ?? 0,
        peerSignalsStrong: derived.consistencyScore >= 55,
        gapsFlagged,
      }),
    [
      state.trustScore,
      state.confidenceScore,
      initial.referenceCount,
      initial.jobCount,
      derived.consistencyScore,
      gapsFlagged,
    ]
  );

  const improveLines = useMemo(
    () =>
      improvementHints({
        trust: state.trustScore,
        confidencePct: state.confidenceScore,
        referenceCount: initial.referenceCount ?? 0,
      }),
    [state.trustScore, state.confidenceScore, initial.referenceCount]
  );

  const businessImpact = useMemo(() => {
    const missHireRisk = Math.min(100, Math.round(100 - state.trustScore + (rl === "High" ? 15 : 0)));
    const compliance =
      rl === "Low" ? "Lower exposure" : rl === "Medium" ? "Standard review" : "Elevated review recommended";
    const productivity =
      state.trustScore >= 75 ? "Strong alignment likely" : state.trustScore >= 60 ? "Moderate alignment" : "Higher onboarding attention";
    const retention = Math.min(95, Math.round(45 + state.trustScore * 0.45 + state.confidenceScore * 0.15));
    return { missHireRisk, compliance, productivity, retention };
  }, [state.trustScore, state.confidenceScore, rl]);

  const scenarioInsights = useMemo(() => {
    const base = [...keyInsights];
    if (derived.reviewerCredibility >= 65) base.unshift("Strong supervisor verification");
    if (derived.consistencyScore >= 60) base.unshift("Consistent peer feedback");
    if (state.events.filter((e) => e.type === "verification").length >= 2) {
      base.push("No employment gaps flagged in this view");
    }
    return [...new Set(base)].slice(0, 5);
  }, [keyInsights, derived.reviewerCredibility, derived.consistencyScore, state.events]);

  if (entitlementsLoading && !bootstrapped && !simBlocked) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-slate-500 text-sm">
        Preparing hiring insights…
      </div>
    );
  }

  if (simBlocked) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <Link
          href="/enterprise/dashboard"
          className="text-sm text-indigo-600 font-medium hover:underline inline-block"
        >
          ← Hiring Intelligence Dashboard
        </Link>
        <div className="rounded-2xl border border-amber-200 bg-amber-50/90 p-8 text-center max-w-lg mx-auto">
          <p className="text-lg font-semibold text-slate-900">
            <span aria-hidden>🔒 </span>
            Upgrade to unlock full simulations
          </p>
          <p className="mt-2 text-sm text-slate-600">{simBlockMessage}</p>
          <Link
            href="/enterprise/upgrade"
            className="mt-6 inline-flex rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-indigo-700"
          >
            Upgrade Plan
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link
            href="/enterprise/dashboard"
            className="text-sm text-indigo-600 font-medium hover:underline"
          >
            ← Hiring Intelligence Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 mt-2">Hiring insights</h1>
          <p className="text-sm text-slate-500 mt-1">
            See how verifications and risk change what you see—without changing their live profile.
          </p>
        </div>
        <Link
          href={`/employer/candidates/${candidateId}`}
          className="inline-flex items-center justify-center rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium hover:bg-slate-50"
        >
          Open candidate profile
        </Link>
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        <aside className="lg:col-span-3 space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Candidate</h2>
            <p className="text-lg font-semibold text-slate-900">{initial.fullName}</p>
            {initial.roleHint && <p className="text-sm text-slate-600 mt-2">{initial.roleHint}</p>}
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between gap-2">
                <dt className="text-slate-500">Role focus</dt>
                <dd className="font-medium text-slate-800 text-right">{initial.industryLabel ?? "—"}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-slate-500">Experience signals</dt>
                <dd className="font-medium text-slate-800 text-right">
                  {initial.jobCount != null ? `${initial.jobCount} roles` : "—"}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-slate-500">Profile trust</dt>
                <dd className="font-semibold text-emerald-600 text-right">
                  {initial.trustScore != null ? initial.trustScore : "—"}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-slate-500">Data confidence</dt>
                <dd className="font-medium text-slate-800 text-right">{confidenceLabel}</dd>
              </div>
            </dl>
          </div>
        </aside>

        <section className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
            Predicted hiring outcome
          </h2>
          <div className="flex flex-wrap items-end gap-6">
            <div>
              <p className="text-xs text-slate-500 mb-1">Trust score</p>
              <TrustScoreHint />
              <p
                className={`text-5xl font-bold tabular-nums ${
                  state.trustScore >= 80 ? "text-emerald-600" : state.trustScore >= 60 ? "text-amber-600" : "text-red-600"
                }`}
              >
                {state.trustScore}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Risk level</p>
              <RiskHint />
              <p
                className={`text-2xl font-semibold ${
                  rl === "Low" ? "text-emerald-600" : rl === "Medium" ? "text-amber-600" : "text-red-600"
                }`}
              >
                {rl}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Confidence</p>
              <ConfidenceHint />
              <p className="text-2xl font-semibold text-slate-800">{state.confidenceScore}%</p>
            </div>
          </div>

          <SmartInsight
            trustScore={state.trustScore}
            confidence={confidenceLabel}
            referenceCount={initial.referenceCount ?? 0}
          />
          <SuggestedActions
            trustScore={state.trustScore}
            confidence={confidenceLabel}
            referenceCount={initial.referenceCount ?? 0}
            candidateId={candidateId}
          />

          <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
            <h3 className="text-sm font-semibold text-slate-800 mb-2">Key insights</h3>
            <ul className="text-sm text-slate-600 space-y-2 list-disc list-inside">
              {scenarioInsights.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4">
            <h3 className="text-sm font-semibold text-emerald-900 mb-2">Why this outcome?</h3>
            <ul className="text-sm text-emerald-900/90 space-y-1.5 list-disc list-inside">
              {whyLines.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">
            <h3 className="text-sm font-semibold text-indigo-900 mb-2">What would improve this candidate?</h3>
            <ul className="text-sm text-indigo-900/90 space-y-1.5 list-disc list-inside">
              {improveLines.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>

          <p className="text-xs text-slate-400">
            Suggested move:{" "}
            <span className="font-medium text-slate-600">
              {engineResult.decision === "PASS"
                ? "Proceed with structured interviews"
                : engineResult.decision === "FAIL"
                  ? "Request more verification first"
                  : "Continue evaluation"}
            </span>
          </p>
        </section>

        <aside className="lg:col-span-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">Business impact</h2>
          <ul className="space-y-4 text-sm">
            <li className="flex justify-between gap-2 border-b border-slate-100 pb-3">
              <span className="text-slate-600">Estimated risk exposure</span>
              <span className={`font-semibold ${businessImpact.missHireRisk > 60 ? "text-red-600" : "text-slate-900"}`}>
                {businessImpact.missHireRisk}%
              </span>
            </li>
            <li className="flex justify-between gap-2 border-b border-slate-100 pb-3">
              <span className="text-slate-600">Compliance posture</span>
              <span className="font-medium text-slate-800 text-right">{businessImpact.compliance}</span>
            </li>
            <li className="flex justify-between gap-2 border-b border-slate-100 pb-3">
              <span className="text-slate-600">Productivity alignment</span>
              <span className="font-medium text-slate-800 text-right">{businessImpact.productivity}</span>
            </li>
            <li className="flex justify-between gap-2">
              <span className="text-slate-600">Retention likelihood</span>
              <span className="font-semibold text-emerald-600">{businessImpact.retention}%</span>
            </li>
          </ul>
        </aside>
      </div>

      <section className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-2">Try what-if changes</h2>
        <p className="text-sm text-slate-600 mb-4">
          Tap an action to see how trust and confidence respond—then decide your next step.
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className="rounded-lg bg-emerald-600 text-white px-4 py-2.5 text-sm font-medium hover:bg-emerald-700 shadow-sm"
            onClick={() =>
              engineAction({
                type: "employerReview",
                kind: "positive",
                reason: "Additional verification completed",
              })
            }
          >
            Increase verification
          </button>
          <button
            type="button"
            className="rounded-lg bg-amber-500 text-white px-4 py-2.5 text-sm font-medium hover:bg-amber-600 shadow-sm"
            onClick={() =>
              engineAction({
                type: "employerReview",
                kind: "negative",
                reason: "Negative reference received",
              })
            }
          >
            Add negative review
          </button>
          <button
            type="button"
            className="rounded-lg bg-red-600 text-white px-4 py-2.5 text-sm font-medium hover:bg-red-700 shadow-sm"
            onClick={() =>
              engineAction({
                type: "flagInconsistency",
                reason: "Employment timeline gap",
              })
            }
          >
            Add employment gap signal
          </button>
        </div>
      </section>
    </div>
  );
}
