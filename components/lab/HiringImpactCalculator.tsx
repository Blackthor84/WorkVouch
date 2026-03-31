"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

export type HiringSimulatorProfile = {
  id: string;
  full_name: string | null;
  trust_score: number | null;
  headline: string | null;
  verified_coworkers_count?: number;
  verified_jobs_count?: number;
};

export type JobType = "General" | "Security" | "Management" | "Teaching";

function clampTrust(n: number | null | undefined): number {
  const v = Number(n ?? 0);
  if (!Number.isFinite(v)) return 0;
  return Math.min(100, Math.max(0, Math.round(v)));
}

function getTrustWeight(jobType: JobType): number {
  switch (jobType) {
    case "Security":
      return 1.5;
    case "Management":
      return 1.2;
    case "Teaching":
      return 1.3;
    default:
      return 1;
  }
}

function getCostMultiplier(jobType: JobType): number {
  switch (jobType) {
    case "Security":
      return 1.2;
    case "Management":
      return 1.15;
    case "Teaching":
      return 1.1;
    default:
      return 1;
  }
}

/** risk = total * max(0, 1 - (trust * trustWeight) / 100) */
function weightedRisk(
  totalCost: number,
  trust: number,
  trustWeight: number,
): number {
  const t = clampTrust(trust);
  const factor = Math.max(0, 1 - (t * trustWeight) / 100);
  return Math.round(totalCost * factor);
}

function candidateRisk(
  totalCost: number,
  trust: number,
  trustWeight: number,
): number {
  return weightedRisk(totalCost, trust, trustWeight);
}

function jobRoleNarrative(jobType: JobType): string {
  switch (jobType) {
    case "Security":
      return "In security roles, reliability is critical. Higher trust significantly reduces risk.";
    case "Management":
      return "Management roles impact entire teams. Trust reduces long-term operational risk.";
    case "Teaching":
      return "Teaching roles require consistency and long-term trust. Verified coworkers are especially important.";
    default:
      return "";
  }
}

function impactMessageForJob(jobType: JobType): string {
  switch (jobType) {
    case "Security":
      return "A bad hire here could lead to serious operational or safety risks.";
    case "Management":
      return "A bad hire here can affect entire teams and productivity.";
    case "Teaching":
      return "A bad hire here can impact long-term outcomes and trust.";
    default:
      return "";
  }
}

const benchmarks: Record<JobType, number> = {
  General: 60,
  Security: 75,
  Management: 70,
  Teaching: 72,
};

export type TrustTier = "Elite" | "Strong" | "Average" | "High Risk";

function getTier(trustScore: number, benchmark: number): TrustTier {
  if (trustScore >= benchmark + 15) return "Elite";
  if (trustScore >= benchmark) return "Strong";
  if (trustScore >= benchmark - 10) return "Average";
  return "High Risk";
}

function tierInsightSentence(tier: TrustTier): string {
  switch (tier) {
    case "Elite":
      return "This candidate significantly exceeds typical trust levels for this role.";
    case "Strong":
      return "This candidate meets or exceeds industry expectations.";
    case "Average":
      return "This candidate is within normal range but may carry moderate risk.";
    default:
      return "This candidate falls below expected trust levels and may increase hiring risk.";
  }
}

function tierBadgeClass(tier: TrustTier): string {
  switch (tier) {
    case "Elite":
      return "bg-emerald-600 text-white";
    case "Strong":
      return "bg-blue-600 text-white";
    case "Average":
      return "bg-amber-400 text-amber-950";
    default:
      return "bg-red-600 text-white";
  }
}

function benchmarkVsTrustLine(trust: number, benchmarkVal: number): string {
  if (trust > benchmarkVal) return "Above industry standard";
  if (trust < benchmarkVal) return "Below industry standard";
  return "At industry benchmark";
}

export type PairwiseExplanation = {
  summary: string;
  reason: string;
  savingsText: string;
  trustNote: string;
  confidenceLabel: "high" | "medium" | "low";
  confidenceDescription: string;
  coworkerNote?: string;
  recommendedName: string;
  jobType: JobType;
  impactMessage: string;
  tierInsight: string;
  recommendedTier: TrustTier;
  benchmark: number;
  benchmarkComparison: string;
};

/** Human-readable reasoning for A vs B (trust + risk + optional coworker signal). */
function generateExplanation(
  candidateA: HiringSimulatorProfile | undefined,
  candidateB: HiringSimulatorProfile | undefined,
  trustA: number,
  trustB: number,
  adjustedA: number,
  adjustedB: number,
  totalCostForConfidence: number,
  jobType: JobType,
): PairwiseExplanation | null {
  if (adjustedA === adjustedB) return null;

  const aBetter = adjustedA < adjustedB;
  const betterProf = aBetter ? candidateA : candidateB;
  const worseProf = aBetter ? candidateB : candidateA;
  const betterTrust = aBetter ? trustA : trustB;
  const worseTrust = aBetter ? trustB : trustA;
  const savings = Math.abs(adjustedA - adjustedB);

  const betterName =
    betterProf?.full_name?.trim() ?? (aBetter ? "Candidate A" : "Candidate B");
  const worseName =
    worseProf?.full_name?.trim() ?? (aBetter ? "Candidate B" : "Candidate A");

  const benchmark = benchmarks[jobType];
  const recommendedTier = getTier(betterTrust, benchmark);
  const tierInsight = tierInsightSentence(recommendedTier);
  const benchmarkComparison = benchmarkVsTrustLine(betterTrust, benchmark);

  const narrative = jobRoleNarrative(jobType);
  const baseComparison = `${betterName} has a higher trust score (${betterTrust} vs ${worseTrust} for ${worseName}), which lowers estimated hiring risk under this ${jobType.toLowerCase()} scenario.`;
  const reason = narrative
    ? `${narrative} ${baseComparison}`
    : baseComparison;

  const trustDiff = Math.abs(trustA - trustB);
  let trustNote = "";
  if (trustDiff > 30) {
    trustNote =
      "This candidate is significantly more trusted by coworkers.";
  } else if (trustDiff < 10) {
    trustNote =
      "Both candidates have similar trust levels. Consider additional factors.";
  }

  const confidenceRatio =
    totalCostForConfidence > 0 ? savings / totalCostForConfidence : 0;
  let confidenceLabel: "high" | "medium" | "low" = "low";
  if (confidenceRatio >= 0.15) confidenceLabel = "high";
  else if (confidenceRatio >= 0.05) confidenceLabel = "medium";

  const confidenceDescription =
    confidenceLabel === "high"
      ? "High confidence — the risk gap is large relative to your role-adjusted bad-hire baseline."
      : confidenceLabel === "medium"
        ? "Medium confidence — meaningful gap, but not decisive on its own."
        : "Low confidence — risk scores are close; use this as one signal among many.";

  let coworkerNote: string | undefined;
  const betterCw = betterProf?.verified_coworkers_count ?? 0;
  const worseCw = worseProf?.verified_coworkers_count ?? 0;
  if (betterCw > worseCw) {
    coworkerNote =
      "More verified coworkers increases confidence in this candidate.";
  }

  return {
    summary: `Recommended: ${betterName}`,
    reason,
    savingsText: `Choosing ${betterName} could reduce potential loss by $${savings.toLocaleString()}.`,
    trustNote,
    confidenceLabel,
    confidenceDescription,
    coworkerNote,
    recommendedName: betterName,
    jobType,
    impactMessage: impactMessageForJob(jobType),
    tierInsight,
    recommendedTier,
    benchmark,
    benchmarkComparison,
  };
}

export default function HiringImpactCalculator() {
  const [salary, setSalary] = useState(70000);
  const [trainingWeeks, setTrainingWeeks] = useState(6);
  const [replacementWeeks, setReplacementWeeks] = useState(4);
  const [trustA, setTrustA] = useState(80);
  const [trustB, setTrustB] = useState(40);
  const [jobType, setJobType] = useState<JobType>("General");

  const [candidates, setCandidates] = useState<HiringSimulatorProfile[]>([]);
  const [selectedCandidates, setSelectedCandidates] = useState<
    HiringSimulatorProfile[]
  >([]);
  const [candidatesLoading, setCandidatesLoading] = useState(true);
  const [candidatesError, setCandidatesError] = useState<string | null>(null);

  const [resumeStatus, setResumeStatus] = useState<{
    a: string | null;
    b: string | null;
  }>({ a: null, b: null });
  const [resumeBusy, setResumeBusy] = useState<"a" | "b" | null>(null);

  const twoFromProfiles = selectedCandidates.length === 2;
  const trustLocked = twoFromProfiles;

  const trainingCost = salary * (trainingWeeks / 52);
  const lostProductivity = salary * (replacementWeeks / 52);
  const rehiringCost = salary * 0.25;

  const total = Math.round(
    trainingCost + lostProductivity + rehiringCost,
  );

  const roleCostMultiplier = getCostMultiplier(jobType);
  const weightedTotal = Math.round(total * roleCostMultiplier);
  const trustWeight = getTrustWeight(jobType);
  const benchmark = benchmarks[jobType];

  const adjustedA = weightedRisk(weightedTotal, trustA, trustWeight);
  const adjustedB = weightedRisk(weightedTotal, trustB, trustWeight);

  const displayNameA =
    selectedCandidates[0]?.full_name?.trim() || "Candidate A";
  const displayNameB =
    selectedCandidates[1]?.full_name?.trim() || "Candidate B";

  const pairwiseExplanation = useMemo(
    () =>
      generateExplanation(
        selectedCandidates[0],
        selectedCandidates[1],
        trustA,
        trustB,
        adjustedA,
        adjustedB,
        weightedTotal,
        jobType,
      ),
    [
      selectedCandidates,
      trustA,
      trustB,
      adjustedA,
      adjustedB,
      weightedTotal,
      jobType,
    ],
  );

  const pairwiseBetterId = useMemo(() => {
    if (selectedCandidates.length !== 2 || adjustedA === adjustedB) {
      return null;
    }
    return adjustedA < adjustedB
      ? selectedCandidates[0].id
      : selectedCandidates[1].id;
  }, [selectedCandidates, adjustedA, adjustedB]);

  const pairwiseWorseId = useMemo(() => {
    if (selectedCandidates.length !== 2 || adjustedA === adjustedB) {
      return null;
    }
    return adjustedA < adjustedB
      ? selectedCandidates[1].id
      : selectedCandidates[0].id;
  }, [selectedCandidates, adjustedA, adjustedB]);

  const topPick = useMemo(() => {
    if (!candidates.length || weightedTotal <= 0) return null;
    let best: {
      profile: HiringSimulatorProfile;
      risk: number;
      trust: number;
    } | null = null;
    let sumRisk = 0;
    for (const c of candidates) {
      const t = clampTrust(c.trust_score);
      const risk = candidateRisk(weightedTotal, t, trustWeight);
      sumRisk += risk;
      if (!best || risk < best.risk) {
        best = { profile: c, risk, trust: t };
      }
    }
    const avgRisk = Math.round(sumRisk / candidates.length);
    const savingsVsAvg =
      best != null ? Math.max(0, avgRisk - best.risk) : 0;
    return best ? { ...best, avgRisk, savingsVsAvg } : null;
  }, [candidates, weightedTotal, trustWeight]);

  const topPickTrustTier =
    topPick != null ? getTier(topPick.trust, benchmark) : null;

  useEffect(() => {
    let cancelled = false;
    setCandidatesLoading(true);
    setCandidatesError(null);
    fetch("/api/lab/hiring-simulator-candidates")
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (!Array.isArray(data.candidates)) {
          setCandidates([]);
          return;
        }
        setCandidates(data.candidates as HiringSimulatorProfile[]);
        if (data.error) setCandidatesError(String(data.error));
      })
      .catch(() => {
        if (!cancelled) {
          setCandidatesError("Could not load candidates.");
          setCandidates([]);
        }
      })
      .finally(() => {
        if (!cancelled) setCandidatesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (selectedCandidates.length === 2) {
      setTrustA(clampTrust(selectedCandidates[0].trust_score));
      setTrustB(clampTrust(selectedCandidates[1].trust_score));
    }
  }, [selectedCandidates]);

  const toggleCandidate = useCallback((c: HiringSimulatorProfile) => {
    setSelectedCandidates((prev) => {
      const idx = prev.findIndex((x) => x.id === c.id);
      if (idx >= 0) return prev.filter((x) => x.id !== c.id);
      if (prev.length >= 2) return [prev[0], c];
      return [...prev, c];
    });
  }, []);

  const postResume = useCallback(
    async (candidateId: string, slot: "a" | "b") => {
      setResumeStatus((s) => ({ ...s, [slot]: null }));
      setResumeBusy(slot);
      try {
        const res = await fetch("/api/employer/resume-requests", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ candidate_id: candidateId }),
        });
        const data = await res.json();
        if (!res.ok) {
          setResumeStatus((s) => ({
            ...s,
            [slot]:
              typeof data.error === "string"
                ? data.error
                : "Could not send request.",
          }));
          return;
        }
        setResumeStatus((s) => ({
          ...s,
          [slot]:
            data.duplicate === true
              ? (data.message as string) ?? "Already requested."
              : "Request sent",
        }));
      } catch {
        setResumeStatus((s) => ({
          ...s,
          [slot]: "Network error. Try again.",
        }));
      } finally {
        setResumeBusy(null);
      }
    },
    [],
  );

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 max-w-4xl w-full space-y-8">

      {/* HEADER */}
      <div>
        <h2 className="text-2xl font-bold">Hiring Risk Simulator</h2>
        <p className="text-gray-500 text-sm">
          Estimate the true cost of a bad hire and compare candidates.
        </p>
      </div>

      {/* JOB TYPE */}
      <div>
        <label htmlFor="lab-job-type" className="text-sm font-medium text-gray-700">
          Job type
        </label>
        <select
          id="lab-job-type"
          value={jobType}
          onChange={(e) => setJobType(e.target.value as JobType)}
          className="w-full p-3 border rounded-lg mb-4 mt-2"
        >
          <option value="General">General</option>
          <option value="Security">Security</option>
          <option value="Management">Management</option>
          <option value="Teaching">Teaching</option>
        </select>
        <p className="text-xs text-gray-500 -mt-2 mb-1">
          Trust and baseline cost adjust for role risk (weight ×
          {trustWeight.toFixed(1)}, cost ×{roleCostMultiplier}).
        </p>
      </div>

      {/* REAL CANDIDATES */}
      <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-5">
        <p className="text-sm font-medium text-gray-800">
          Select up to 2 candidates
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Pick real profiles to auto-fill trust scores, or use manual sliders
          below when fewer than two are selected.
        </p>

        {candidatesLoading && (
          <p className="text-sm text-gray-500 mt-4">Loading candidates…</p>
        )}
        {candidatesError && !candidatesLoading && (
          <p className="text-sm text-amber-700 mt-4" role="status">
            {candidatesError}
          </p>
        )}
        {!candidatesLoading && candidates.length === 0 && !candidatesError && (
          <p className="text-sm text-gray-500 mt-4">No candidates available.</p>
        )}

        {!candidatesLoading && candidates.length > 0 && (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 max-h-64 overflow-y-auto pr-1">
            {candidates.map((c) => {
              const selected = selectedCandidates.some((x) => x.id === c.id);
              const order = selectedCandidates.findIndex((x) => x.id === c.id);
              const isTop = topPick?.profile.id === c.id;
              const isPairwisePick =
                pairwiseBetterId != null && c.id === pairwiseBetterId;
              const isPairwiseRisk =
                pairwiseWorseId != null && c.id === pairwiseWorseId;
              const showRecommendedBadge = isTop || isPairwisePick;
              const listTrust = clampTrust(c.trust_score);
              const listTier = getTier(listTrust, benchmark);
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => toggleCandidate(c)}
                  className={`rounded-xl border p-3 text-left text-sm transition-all hover:shadow-md ${
                    selected
                      ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200"
                      : isPairwisePick || isTop
                        ? "border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-200"
                        : isPairwiseRisk
                          ? "border-amber-400 bg-amber-50/40 ring-1 ring-amber-200"
                          : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-semibold text-gray-900 line-clamp-1">
                      {c.full_name?.trim() || "Unnamed"}
                    </span>
                    <span className="flex shrink-0 flex-col items-end gap-1">
                      {showRecommendedBadge && (
                        <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                          Recommended
                        </span>
                      )}
                      {isPairwiseRisk && !showRecommendedBadge && (
                        <span className="rounded-full bg-amber-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-900">
                          Higher risk
                        </span>
                      )}
                      {selected && (
                        <span className="text-xs font-medium text-blue-700">
                          {order === 0 ? "A" : "B"}
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${tierBadgeClass(listTier)}`}
                    >
                      Tier: {listTier}
                    </span>
                  </div>
                  <p className="text-xs text-amber-800 mt-1">
                    Trust {listTrust}
                  </p>
                  <p className="text-[11px] text-gray-600 tabular-nums">
                    Industry benchmark: {benchmark}
                  </p>
                  <p className="text-[11px] text-gray-700">
                    {benchmarkVsTrustLine(listTrust, benchmark)}
                  </p>
                  {c.headline?.trim() ? (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                      {c.headline}
                    </p>
                  ) : null}
                  {(c.verified_coworkers_count ?? 0) > 0 && (
                    <p className="text-xs text-gray-600 mt-1">
                      {c.verified_coworkers_count} verified coworker
                      {(c.verified_coworkers_count ?? 0) === 1 ? "" : "s"}
                    </p>
                  )}
                  {(c.verified_jobs_count ?? 0) > 0 && (
                    <p className="text-xs text-gray-600">
                      {c.verified_jobs_count} verified job
                      {(c.verified_jobs_count ?? 0) === 1 ? "" : "s"}
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {selectedCandidates.length < 2 && (
          <p className="text-xs text-gray-500 mt-3">
            {selectedCandidates.length === 0
              ? "Select two candidates for profile-based trust, or adjust manual trust sliders in the comparison section."
              : "Select one more candidate to lock trust scores from profiles, or keep using manual sliders."}
          </p>
        )}
        {twoFromProfiles && (
          <p className="text-xs text-blue-700 mt-3 font-medium">
            Trust scores are set from selected profiles. Clear a selection to
            use manual sliders again.
          </p>
        )}
      </div>

      {/* SALARY INPUT */}
      <div>
        <label htmlFor="lab-hiring-salary" className="text-sm text-gray-600">
          Annual Salary
        </label>
        <div className="relative mt-2">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
            $
          </span>
          <input
            id="lab-hiring-salary"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            value={salary.toLocaleString("en-US")}
            onChange={(e) => {
              const raw = e.target.value.replace(/,/g, "");
              const num = parseInt(raw, 10);
              setSalary(Number.isFinite(num) && num >= 0 ? num : 0);
            }}
            className="w-full pl-8 pr-4 py-3 border rounded-xl font-semibold"
          />
        </div>
      </div>

      {/* SLIDERS */}
      <div className="space-y-4">

        <div>
          <label className="text-sm text-gray-600">
            Training Time: {trainingWeeks} weeks
          </label>
          <input
            type="range"
            min="1"
            max="12"
            value={trainingWeeks}
            onChange={(e) => setTrainingWeeks(Number(e.target.value))}
            className="w-full"
          />
        </div>

        <div>
          <label className="text-sm text-gray-600">
            Replacement Time: {replacementWeeks} weeks
          </label>
          <input
            type="range"
            min="1"
            max="12"
            value={replacementWeeks}
            onChange={(e) => setReplacementWeeks(Number(e.target.value))}
            className="w-full"
          />
        </div>

      </div>

      {/* JOB CONTEXT — above results */}
      <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 px-5 py-4">
        <p className="text-sm font-semibold text-indigo-950">
          Evaluating for: <span className="text-indigo-700">{jobType}</span>
        </p>
        {impactMessageForJob(jobType) ? (
          <p className="text-sm text-indigo-900/90 mt-2">
            {impactMessageForJob(jobType)}
          </p>
        ) : null}
        <p className="text-sm text-indigo-800 mt-2 font-medium tabular-nums">
          Industry benchmark (trust): {benchmark}
        </p>
      </div>

      {/* TOTAL COST */}
      <div className="bg-gray-50 rounded-xl p-6 text-center">
        <p className="text-gray-500">Role-adjusted total (bad hire baseline)</p>
        <div className="text-4xl font-bold text-red-500 my-2">
          ${weightedTotal.toLocaleString()}
        </div>
        <p className="text-xs text-gray-500 mb-3">
          Base estimate ${total.toLocaleString()} × {jobType} multiplier (
          {roleCostMultiplier})
        </p>

        <div className="text-sm text-gray-600">
          Training: ${Math.round(trainingCost).toLocaleString()} •
          Productivity Loss: ${Math.round(lostProductivity).toLocaleString()} •
          Rehire: ${Math.round(rehiringCost).toLocaleString()}
        </div>
      </div>

      {/* RISK METER 🔥 */}
      <div>
        <p className="text-sm text-gray-600 mb-2">Hiring Risk Level</p>
        <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-red-500 transition-all"
            style={{
              width: `${Math.min((weightedTotal / 50000) * 100, 100)}%`,
            }}
          />
        </div>
      </div>

      {/* TOP CANDIDATE (ranking) */}
      {topPick && (
        <div className="rounded-xl border-2 border-emerald-400 bg-gradient-to-b from-emerald-50/90 to-white p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <span className="rounded-full bg-emerald-600 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-white">
              Top pick
            </span>
            <h3 className="text-lg font-bold text-gray-900">
              Top Candidate Recommendation
            </h3>
          </div>
          <p className="text-sm font-semibold text-gray-900">
            {topPick.profile.full_name?.trim() || "Candidate"}
          </p>
          {topPickTrustTier != null ? (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide ${tierBadgeClass(topPickTrustTier)}`}
              >
                Tier: {topPickTrustTier}
              </span>
            </div>
          ) : null}
          <p className="text-sm text-gray-600 mt-1">
            Trust score:{" "}
            <span className="font-medium tabular-nums">{topPick.trust}</span> / 100
          </p>
          <p className="text-sm text-gray-700 mt-1 tabular-nums">
            Industry benchmark: {benchmark}
          </p>
          <p className="text-sm text-gray-800">
            {benchmarkVsTrustLine(topPick.trust, benchmark)}
          </p>
          <p className="text-sm text-gray-600 mt-2">
            {tierInsightSentence(getTier(topPick.trust, benchmark))}
          </p>
          <p className="text-lg font-bold text-red-600 mt-2 tabular-nums">
            Estimated risk: ${topPick.risk.toLocaleString()}
          </p>
          <p className="text-sm text-gray-600 mt-3">
            Based on your inputs and <strong>{jobType}</strong> weighting, this
            candidate has the lowest hiring risk in this list.
          </p>
          {topPick.savingsVsAvg > 0 && (
            <p className="text-sm font-medium text-emerald-800 mt-3">
              Choosing this candidate could save you{" "}
              <span className="tabular-nums">
                ${topPick.savingsVsAvg.toLocaleString()}
              </span>{" "}
              vs the average risk across loaded profiles (
              <span className="tabular-nums">
                ${topPick.avgRisk.toLocaleString()}
              </span>{" "}
              avg).
            </p>
          )}
        </div>
      )}

      {/* COMPARE CANDIDATES */}
      <div className="grid md:grid-cols-2 gap-6">

        <div className="p-4 border rounded-xl transition-shadow hover:shadow-md">
          <p className="font-semibold mb-2">{displayNameA}</p>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${tierBadgeClass(getTier(trustA, benchmark))}`}
            >
              Tier: {getTier(trustA, benchmark)}
            </span>
          </div>

          <input
            type="range"
            min="0"
            max="100"
            value={trustA}
            disabled={trustLocked}
            onChange={(e) => setTrustA(Number(e.target.value))}
            className="w-full mb-2 disabled:opacity-40 disabled:cursor-not-allowed"
          />

          <p className="text-sm text-gray-600">Trust: {trustA}</p>
          <p className="text-xs text-gray-700 tabular-nums">
            Industry benchmark: {benchmark}
          </p>
          <p className="text-xs text-gray-800">
            {benchmarkVsTrustLine(trustA, benchmark)}
          </p>
          <p className="text-xs text-gray-600 mt-1 leading-snug">
            {tierInsightSentence(getTier(trustA, benchmark))}
          </p>
          <p className="text-red-500 font-bold text-lg">
            Risk: ${adjustedA.toLocaleString()}
          </p>

          {selectedCandidates[0] && (
            <div className="mt-4 space-y-1">
              <button
                type="button"
                disabled={resumeBusy === "a"}
                onClick={() =>
                  void postResume(selectedCandidates[0].id, "a")
                }
                className="w-full rounded-lg border border-gray-900 bg-white py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50 disabled:opacity-50"
              >
                {resumeBusy === "a" ? "Sending…" : "Request Resume"}
              </button>
              {resumeStatus.a && (
                <p className="text-xs text-emerald-700">{resumeStatus.a}</p>
              )}
            </div>
          )}
        </div>

        <div
          className={`p-4 border rounded-xl transition-shadow hover:shadow-md ${
            adjustedB < adjustedA
              ? "border-emerald-400 ring-1 ring-emerald-200 bg-emerald-50/30"
              : adjustedB > adjustedA
                ? "border-amber-300 ring-1 ring-amber-100 bg-amber-50/20"
                : ""
          }`}
        >
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <p className="font-semibold">{displayNameB}</p>
            {adjustedB < adjustedA && (
              <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                Recommended
              </span>
            )}
            {adjustedB > adjustedA && (
              <span className="rounded-full bg-amber-200 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-900">
                Higher risk
              </span>
            )}
          </div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${tierBadgeClass(getTier(trustB, benchmark))}`}
            >
              Tier: {getTier(trustB, benchmark)}
            </span>
          </div>

          <input
            type="range"
            min="0"
            max="100"
            value={trustB}
            disabled={trustLocked}
            onChange={(e) => setTrustB(Number(e.target.value))}
            className="w-full mb-2 disabled:opacity-40 disabled:cursor-not-allowed"
          />

          <p className="text-sm text-gray-600">Trust: {trustB}</p>
          <p className="text-xs text-gray-700 tabular-nums">
            Industry benchmark: {benchmark}
          </p>
          <p className="text-xs text-gray-800">
            {benchmarkVsTrustLine(trustB, benchmark)}
          </p>
          <p className="text-xs text-gray-600 mt-1 leading-snug">
            {tierInsightSentence(getTier(trustB, benchmark))}
          </p>
          <p className="text-red-500 font-bold text-lg">
            Risk: ${adjustedB.toLocaleString()}
          </p>

          {selectedCandidates[1] && (
            <div className="mt-4 space-y-1">
              <button
                type="button"
                disabled={resumeBusy === "b"}
                onClick={() =>
                  void postResume(selectedCandidates[1].id, "b")
                }
                className="w-full rounded-lg border border-gray-900 bg-white py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50 disabled:opacity-50"
              >
                {resumeBusy === "b" ? "Sending…" : "Request Resume"}
              </button>
              {resumeStatus.b && (
                <p className="text-xs text-emerald-700">{resumeStatus.b}</p>
              )}
            </div>
          )}
        </div>

      </div>

      {/* REASONING & RECOMMENDATION */}
      <div className="rounded-xl border border-slate-200 bg-slate-50/90 p-6 space-y-4">
        <div className="flex flex-wrap items-center gap-2 justify-between">
          <p className="text-base font-semibold text-slate-900">Recommendation</p>
          {pairwiseExplanation && (
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                pairwiseExplanation.confidenceLabel === "high"
                  ? "bg-emerald-100 text-emerald-900"
                  : pairwiseExplanation.confidenceLabel === "medium"
                    ? "bg-amber-100 text-amber-900"
                    : "bg-gray-200 text-gray-700"
              }`}
            >
              {pairwiseExplanation.confidenceLabel === "high"
                ? "High confidence"
                : pairwiseExplanation.confidenceLabel === "medium"
                  ? "Medium confidence"
                  : "Low confidence"}
            </span>
          )}
        </div>

        {pairwiseExplanation ? (
          <>
            <p className="text-xl font-bold text-slate-900">
              {pairwiseExplanation.summary}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${tierBadgeClass(pairwiseExplanation.recommendedTier)}`}
              >
                Tier: {pairwiseExplanation.recommendedTier}
              </span>
              <span className="text-sm font-medium text-slate-700 tabular-nums">
                Industry benchmark: {pairwiseExplanation.benchmark}
              </span>
              <span className="text-sm text-slate-800">
                {pairwiseExplanation.benchmarkComparison}
              </span>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed">
              {pairwiseExplanation.reason}
            </p>
            <p className="text-sm text-slate-700 border-l-2 border-indigo-200 pl-3">
              {pairwiseExplanation.tierInsight}
            </p>
            {pairwiseExplanation.trustNote ? (
              <p className="text-sm text-slate-600 italic border-l-2 border-slate-300 pl-3">
                {pairwiseExplanation.trustNote}
              </p>
            ) : null}
            <p className="text-base font-semibold text-red-700 bg-red-50 rounded-lg px-4 py-3 border border-red-100">
              {pairwiseExplanation.savingsText}
            </p>
            {pairwiseExplanation.coworkerNote ? (
              <p className="text-sm text-slate-700">
                {pairwiseExplanation.coworkerNote}
              </p>
            ) : null}
            <p className="text-xs text-slate-500">
              {pairwiseExplanation.confidenceDescription}{" "}
              <span className="tabular-nums">
                (Gap / baseline:{" "}
                {weightedTotal > 0
                  ? `${((Math.abs(adjustedA - adjustedB) / weightedTotal) * 100).toFixed(1)}%`
                  : "—"}
                )
              </span>
            </p>
          </>
        ) : (
          <p className="text-sm text-slate-600">
            {adjustedA === adjustedB
              ? "Tie — same estimated risk for both options at these trust scores."
              : "Adjust trust scores or select two candidates to see a full recommendation."}
          </p>
        )}
      </div>

      {/* CTA */}
      <button type="button" className="w-full bg-black text-white py-3 rounded-xl hover:opacity-90">
        Reduce this risk with WorkVouch
      </button>

    </div>
  );
}
