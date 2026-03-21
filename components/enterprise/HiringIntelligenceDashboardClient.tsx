"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { SmartInsight } from "@/components/guidance/SmartInsight";
import { TrustScoreHint } from "@/components/guidance/TrustMetricHints";
import type {
  HiringIntelligenceCandidate,
  PipelineStage,
  RiskLevel,
} from "@/lib/enterprise/hiringIntelligenceTypes";

type RangeKey = "7" | "30" | "90";

const PIPELINE: PipelineStage[] = ["new", "reviewing", "verified", "hired", "rejected"];

const PIPELINE_LABELS: Record<PipelineStage, string> = {
  new: "New",
  reviewing: "Reviewing",
  verified: "Verified",
  hired: "Hired",
  rejected: "Rejected",
};

function trustColor(score: number | null): string {
  if (score == null) return "text-slate-500";
  if (score >= 80) return "text-emerald-600";
  if (score >= 60) return "text-amber-600";
  return "text-red-600";
}

function riskBadge(level: RiskLevel): string {
  if (level === "low") return "bg-emerald-50 text-emerald-800 border-emerald-200";
  if (level === "medium") return "bg-amber-50 text-amber-900 border-amber-200";
  return "bg-red-50 text-red-800 border-red-200";
}

function CandidateCard({ c }: { c: HiringIntelligenceCandidate }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm hover:shadow-md transition-shadow">
      <p className="font-medium text-slate-900 text-sm truncate">{c.fullName}</p>
      <p className={`text-2xl font-semibold tabular-nums ${trustColor(c.trustScore)}`}>
        {c.trustScore != null ? c.trustScore : "—"}
      </p>
      <p className="text-xs text-slate-500 mt-1">
        {c.verificationCount} verification{c.verificationCount === 1 ? "" : "s"}
      </p>
      <span
        className={`inline-block mt-2 text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full border ${riskBadge(c.riskLevel)}`}
      >
        {c.riskLevel} risk
      </span>
    </div>
  );
}

export function HiringIntelligenceDashboardClient() {
  const [range, setRange] = useState<RangeKey>("30");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [candidates, setCandidates] = useState<HiringIntelligenceCandidate[]>([]);
  const [metrics, setMetrics] = useState({
    totalCandidates: 0,
    avgTrustScore: 0,
    highRiskPct: 0,
    verifiedPct: 0,
  });

  const [trustMin, setTrustMin] = useState(0);
  const [trustMax, setTrustMax] = useState(100);
  const [minVerifications, setMinVerifications] = useState(0);
  const [riskFilter, setRiskFilter] = useState<Set<RiskLevel>>(() => new Set(["low", "medium", "high"]));
  const [industryFilter, setIndustryFilter] = useState<string>("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [limitedPreview, setLimitedPreview] = useState(false);
  const [upgradeUrl, setUpgradeUrl] = useState("/enterprise/upgrade");
  const [previewCap, setPreviewCap] = useState<number | null>(null);
  const [hasMoreCandidates, setHasMoreCandidates] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/employer/hiring-intelligence/summary?range=${range}`, {
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data?.error === "string" ? data.error : "Could not load dashboard");
        return;
      }
      setCompanyName(data.companyName ?? "");
      setCandidates(Array.isArray(data.candidates) ? data.candidates : []);
      if (data.metrics) setMetrics(data.metrics);
    } catch {
      setError("Could not load dashboard");
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    load();
  }, [load]);

  const industries = useMemo(() => {
    const s = new Set<string>();
    candidates.forEach((c) => {
      if (c.industry) s.add(c.industry);
    });
    return [...s].sort();
  }, [candidates]);

  const filtered = useMemo(() => {
    return candidates.filter((c) => {
      const t = c.trustScore ?? 0;
      if (t < trustMin || t > trustMax) return false;
      if (c.verificationCount < minVerifications) return false;
      if (!riskFilter.has(c.riskLevel)) return false;
      if (industryFilter && (c.industry ?? "") !== industryFilter) return false;
      return true;
    });
  }, [candidates, trustMin, trustMax, minVerifications, riskFilter, industryFilter]);

  const byStage = useMemo(() => {
    const m: Record<PipelineStage, HiringIntelligenceCandidate[]> = {
      new: [],
      reviewing: [],
      verified: [],
      hired: [],
      rejected: [],
    };
    filtered.forEach((c) => {
      m[c.pipelineStage].push(c);
    });
    return m;
  }, [filtered]);

  const toggleRisk = (r: RiskLevel) => {
    setRiskFilter((prev) => {
      const next = new Set(prev);
      if (next.has(r)) next.delete(r);
      else next.add(r);
      if (next.size === 0) return new Set(["low", "medium", "high"]);
      return next;
    });
  };

  if (loading && candidates.length === 0) {
    return (
      <div className="animate-pulse space-y-6 max-w-7xl mx-auto px-4 py-8">
        <div className="h-10 bg-slate-200 rounded w-1/3" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-slate-200 rounded-xl" />
          ))}
        </div>
        <div className="h-64 bg-slate-200 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <header className="space-y-2">
        <p className="text-sm font-medium text-indigo-600">Hiring Intelligence</p>
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Hiring Intelligence Dashboard
            </h1>
            <p className="text-slate-600 mt-1">{companyName}</p>
            <p className="text-sm text-slate-500 mt-2 max-w-xl">
              Make confident hiring decisions. Reduce hiring risk with verified data. Turn trust into a
              measurable signal.
            </p>
          </div>
          <div className="flex rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
            {(["7", "30", "90"] as const).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setRange(d)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  range === d ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                {d}d
              </button>
            ))}
          </div>
        </div>
      </header>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 text-red-800 px-4 py-3 text-sm">{error}</div>
      )}

      {limitedPreview && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/90 px-4 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="font-semibold text-slate-900">
              <span aria-hidden>🔒 </span>
              Upgrade to unlock full insights
            </p>
            <p className="text-sm text-slate-600 mt-1">
              You&apos;re on a free preview
              {previewCap != null ? ` (showing up to ${previewCap} saved candidates)` : ""}.
              {hasMoreCandidates ? " More candidates are hidden until you upgrade." : ""} See full trust scores,
              verification counts, and analytics with a paid plan.
            </p>
          </div>
          <a
            href={upgradeUrl}
            className="inline-flex shrink-0 justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Upgrade Plan
          </a>
        </div>
      )}

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total candidates</p>
          <p className="text-3xl font-semibold text-slate-900 mt-1 tabular-nums">{metrics.totalCandidates}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Avg trust score</p>
          <p className="text-3xl font-semibold text-emerald-600 mt-1 tabular-nums">{metrics.avgTrustScore}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">High risk</p>
          <p className="text-3xl font-semibold text-red-600 mt-1 tabular-nums">{metrics.highRiskPct}%</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Verified / strong</p>
          <p className="text-3xl font-semibold text-indigo-600 mt-1 tabular-nums">{metrics.verifiedPct}%</p>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 sm:p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Hiring pipeline</h2>
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x">
          {PIPELINE.map((stage) => (
            <div
              key={stage}
              className="min-w-[220px] sm:min-w-[200px] flex-1 snap-start rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
            >
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                {PIPELINE_LABELS[stage]}
                <span className="ml-2 text-slate-400 font-normal">({byStage[stage].length})</span>
              </h3>
              <div className="space-y-2 max-h-[320px] overflow-y-auto">
                {byStage[stage].map((c) => (
                  <CandidateCard key={c.candidateId} c={c} />
                ))}
                {byStage[stage].length === 0 && (
                  <p className="text-xs text-slate-400 py-6 text-center">No candidates</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-900">Saved candidates</h2>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`text-sm px-3 py-1.5 rounded-lg border ${viewMode === "grid" ? "bg-slate-900 text-white border-slate-900" : "border-slate-200"}`}
            >
              Grid
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`text-sm px-3 py-1.5 rounded-lg border ${viewMode === "list" ? "bg-slate-900 text-white border-slate-900" : "border-slate-200"}`}
            >
              List
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-4">
          <h3 className="text-sm font-semibold text-slate-800">Trust filters</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-xs text-slate-500 block mb-1">Trust score (min–max)</label>
              <div className="flex gap-2 items-center">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={trustMin}
                  onChange={(e) => setTrustMin(Number(e.target.value))}
                  className="w-full border rounded-lg px-2 py-1.5 text-sm"
                />
                <span className="text-slate-400">–</span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={trustMax}
                  onChange={(e) => setTrustMax(Number(e.target.value))}
                  className="w-full border rounded-lg px-2 py-1.5 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">Min verifications</label>
              <input
                type="number"
                min={0}
                value={minVerifications}
                onChange={(e) => setMinVerifications(Number(e.target.value))}
                className="w-full border rounded-lg px-2 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">Risk level</label>
              <div className="flex flex-wrap gap-2">
                {(["low", "medium", "high"] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => toggleRisk(r)}
                    className={`text-xs px-2 py-1 rounded-full border capitalize ${
                      riskFilter.has(r) ? "bg-slate-900 text-white border-slate-900" : "border-slate-200"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">Industry</label>
              <select
                value={industryFilter}
                onChange={(e) => setIndustryFilter(e.target.value)}
                className="w-full border rounded-lg px-2 py-1.5 text-sm"
              >
                <option value="">All industries</option>
                {industries.map((ind) => (
                  <option key={ind} value={ind}>
                    {ind}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {viewMode === "grid" ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((c) => (
              <div
                key={c.candidateId}
                className="rounded-xl border border-slate-200 p-4 flex flex-col gap-3 hover:border-indigo-200 transition-colors"
              >
                <div>
                  <p className="font-semibold text-slate-900">{c.fullName}</p>
                  {c.roleHint && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{c.roleHint}</p>}
                  <p className={`text-xl font-bold mt-2 ${trustColor(c.trustScore)}`}>
                    {c.trustScore ?? "—"}{" "}
                    <span className="text-sm font-normal text-slate-500">trust</span>
                  </p>
                  <TrustScoreHint className="mt-1" />
                  <SmartInsight
                    trustScore={c.trustScore ?? 0}
                    referenceCount={c.verificationCount}
                    compact
                    className="mt-2"
                  />
                </div>
                <div className="flex flex-wrap gap-2 mt-auto">
                  <Link
                    href={`/employer/candidates/${c.candidateId}`}
                    className="text-sm px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800"
                  >
                    View profile
                  </Link>
                  <Link
                    href={`/enterprise/simulate/${c.candidateId}`}
                    className="text-sm px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    Hiring insights
                  </Link>
                  <Link
                    href={`/references/request?for=${encodeURIComponent(c.candidateId)}`}
                    className="text-sm px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50"
                  >
                    Request references
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <ul className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
            {filtered.map((c) => (
              <li key={c.candidateId} className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 bg-white">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900">{c.fullName}</p>
                  <p className="text-xs text-slate-500">
                    {c.verificationCount} verifications ·{" "}
                    <span className={trustColor(c.trustScore)}>{c.trustScore ?? "—"} trust</span> ·{" "}
                    <span className="capitalize">{c.riskLevel} risk</span>
                  </p>
                  <div className="mt-2 max-w-md">
                    <SmartInsight
                      trustScore={c.trustScore ?? 0}
                      referenceCount={c.verificationCount}
                      compact
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/employer/candidates/${c.candidateId}`}
                    className="text-sm px-3 py-1.5 rounded-lg bg-slate-100"
                  >
                    Profile
                  </Link>
                  <Link
                    href={`/enterprise/simulate/${c.candidateId}`}
                    className="text-sm px-3 py-1.5 rounded-lg bg-indigo-600 text-white"
                  >
                    Insights
                  </Link>
                  <Link
                    href={`/employer/candidates/${c.candidateId}?intent=references`}
                    className="text-sm px-3 py-1.5 rounded-lg border"
                  >
                    References
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}

        {filtered.length === 0 && !loading && (
          <p className="text-center text-slate-500 py-12 text-sm">
            No candidates match your filters. Save candidates from search to see them here.
          </p>
        )}
      </section>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => load()}
          disabled={loading}
          className="text-sm text-indigo-600 font-medium hover:underline disabled:opacity-50"
        >
          {loading ? "Refreshing…" : "Refresh data"}
        </button>
      </div>
    </div>
  );
}
