"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { HiringIntelligenceCandidate } from "@/lib/enterprise/hiringIntelligenceTypes";

export function TeamRiskClient() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<HiringIntelligenceCandidate[]>([]);
  const [distribution, setDistribution] = useState({ highTrust: 0, mediumTrust: 0, lowTrust: 0 });
  const [workforce, setWorkforce] = useState<{
    workforceRiskAverage: number | null;
    workforceHighRiskCount: number;
    workforceRiskConfidence: number | null;
  } | null>(null);
  const [limitedPreview, setLimitedPreview] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [boardRes, riskRes] = await Promise.all([
        fetch("/api/employer/hiring-intelligence/summary?range=90", { credentials: "include" }),
        fetch("/api/employer/risk-overview", { credentials: "include" }).catch(() => null),
      ]);
      const board = await boardRes.json().catch(() => ({}));
      if (!boardRes.ok) {
        setError(typeof board?.error === "string" ? board.error : "Could not load team view");
        return;
      }
      setCandidates(Array.isArray(board.candidates) ? board.candidates : []);
      if (board.distribution) setDistribution(board.distribution);

      if (riskRes?.ok) {
        const r = await riskRes.json().catch(() => ({}));
        setWorkforce({
          workforceRiskAverage: r.workforceRiskAverage ?? null,
          workforceHighRiskCount: r.workforceHighRiskCount ?? 0,
          workforceRiskConfidence: r.workforceRiskConfidence ?? null,
        });
      } else {
        setWorkforce(null);
      }
    } catch {
      setError("Could not load team view");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const overview = useMemo(() => {
    const withTrust = candidates.filter((c) => c.trustScore != null);
    const avg =
      withTrust.length > 0
        ? Math.round(
            withTrust.reduce((a, c) => a + (c.trustScore as number), 0) / withTrust.length
          )
        : 0;
    const highRiskPct =
      candidates.length > 0
        ? Math.round(
            (candidates.filter((c) => c.riskLevel === "high").length / candidates.length) * 100
          )
        : 0;
    const lowConfPct =
      candidates.length > 0
        ? Math.round(
            (candidates.filter((c) => (c.trustScore ?? 0) < 60 && c.verificationCount < 2).length /
              candidates.length) *
              100
          )
        : 0;
    return { avg, highRiskPct, lowConfPct };
  }, [candidates]);

  const flags = useMemo(() => {
    const noVerifications = candidates.filter((c) => c.verificationCount === 0);
    const stale = candidates.filter((c) => {
      const days = (Date.now() - new Date(c.savedAt).getTime()) / (24 * 60 * 60 * 1000);
      return days > 90 && (c.trustScore ?? 0) < 70;
    });
    const fragile = candidates.filter((c) => c.riskLevel === "high");
    return { noVerifications, stale, fragile };
  }, [candidates]);

  if (loading && candidates.length === 0) {
    return (
      <div className="animate-pulse max-w-7xl mx-auto px-4 py-8 space-y-6">
        <div className="h-10 bg-slate-200 rounded w-1/2" />
        <div className="grid md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-slate-200 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <header>
        <Link href="/enterprise/dashboard" className="text-sm text-indigo-600 font-medium hover:underline">
          ← Hiring Intelligence Dashboard
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2">Team risk view</h1>
        <p className="text-slate-600 mt-2 max-w-2xl">
          Company-wide signals from your saved hiring roster. Turn trust into a measurable signal and reduce
          hiring risk with verified data.
        </p>
      </header>

      {limitedPreview && (
        <div className="rounded-xl border border-indigo-200 bg-indigo-50/80 px-4 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="font-semibold text-slate-900">Team risk &amp; workforce analytics</p>
            <p className="text-sm text-slate-600 mt-1">
              <span aria-hidden>🔒 </span>
              Advanced team risk dashboards and workforce benchmarks are included with Enterprise. You can still
              explore your saved roster preview above—upgrade for full workforce insights.
            </p>
          </div>
          <Link
            href="/enterprise/upgrade"
            className="inline-flex shrink-0 justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Upgrade Plan
          </Link>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 text-amber-900 px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <section className="grid md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-slate-500 uppercase">Avg trust (roster)</p>
          <p className="text-3xl font-semibold text-emerald-600 mt-1 tabular-nums">{overview.avg}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-slate-500 uppercase">High risk profiles</p>
          <p className="text-3xl font-semibold text-red-600 mt-1 tabular-nums">{overview.highRiskPct}%</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-slate-500 uppercase">Low confidence mix</p>
          <p className="text-3xl font-semibold text-amber-600 mt-1 tabular-nums">{overview.lowConfPct}%</p>
        </div>
      </section>

      {workforce && workforce.workforceRiskAverage != null && (
        <p className="text-xs text-slate-500">
          Workforce analytics: avg risk index {workforce.workforceRiskAverage}
          {workforce.workforceHighRiskCount ? ` · ${workforce.workforceHighRiskCount} elevated profiles` : ""}
        </p>
      )}

      <section>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Team grid</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {candidates.map((c) => (
            <div
              key={c.candidateId}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-indigo-200 transition-colors"
            >
              <div className="flex justify-between items-start gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900 truncate">{c.fullName}</p>
                  <p className="text-xs text-slate-500 truncate">{c.industry ?? "Industry not set"}</p>
                </div>
                <Link
                  href={`/enterprise/simulate/${c.candidateId}`}
                  className="text-xs text-indigo-600 font-medium shrink-0"
                >
                  Insights
                </Link>
              </div>
              <div className="mt-3 flex flex-wrap gap-3 text-sm">
                <span
                  className={
                    (c.trustScore ?? 0) >= 80
                      ? "text-emerald-600 font-semibold"
                      : (c.trustScore ?? 0) >= 60
                        ? "text-amber-600 font-semibold"
                        : "text-red-600 font-semibold"
                  }
                >
                  {c.trustScore ?? "—"} trust
                </span>
                <span className="text-slate-400">|</span>
                <span className="capitalize text-slate-700">{c.riskLevel} risk</span>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Last saved {new Date(c.savedAt).toLocaleDateString()} · {c.verificationCount} verifications
              </p>
            </div>
          ))}
        </div>
        {candidates.length === 0 && !loading && (
          <p className="text-slate-500 text-sm py-8 text-center">
            Save candidates from search to populate this view.
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Risk distribution</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="rounded-xl bg-white border border-emerald-100 p-4 text-center">
            <p className="text-xs text-slate-500 uppercase">High trust (80+)</p>
            <p className="text-2xl font-bold text-emerald-600">{distribution.highTrust}</p>
          </div>
          <div className="rounded-xl bg-white border border-amber-100 p-4 text-center">
            <p className="text-xs text-slate-500 uppercase">Medium (60–79)</p>
            <p className="text-2xl font-bold text-amber-600">{distribution.mediumTrust}</p>
          </div>
          <div className="rounded-xl bg-white border border-red-100 p-4 text-center">
            <p className="text-xs text-slate-500 uppercase">Low (&lt;60)</p>
            <p className="text-2xl font-bold text-red-600">{distribution.lowTrust}</p>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">Flags</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <FlagCard
            title="No verifications"
            description="Profiles without independent confirmations yet."
            items={flags.noVerifications}
          />
          <FlagCard
            title="Stale / low momentum"
            description="Saved over 90 days ago with trust still below 70."
            items={flags.stale}
          />
          <FlagCard
            title="High fragility"
            description="Elevated risk based on trust and verification depth."
            items={flags.fragile}
          />
        </div>
      </section>

      <button
        type="button"
        onClick={() => load()}
        className="text-sm text-indigo-600 font-medium hover:underline"
        disabled={loading}
      >
        {loading ? "Refreshing…" : "Refresh"}
      </button>
    </div>
  );
}

function FlagCard({
  title,
  description,
  items,
}: {
  title: string;
  description: string;
  items: HiringIntelligenceCandidate[];
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="font-semibold text-slate-900 text-sm">{title}</h3>
      <p className="text-xs text-slate-500 mt-1">{description}</p>
      <ul className="mt-3 space-y-1 text-sm text-slate-700 max-h-40 overflow-y-auto">
        {items.length === 0 && <li className="text-slate-400">None</li>}
        {items.slice(0, 8).map((c) => (
          <li key={c.candidateId} className="truncate">
            <Link href={`/employer/candidates/${c.candidateId}`} className="hover:text-indigo-600">
              {c.fullName}
            </Link>
          </li>
        ))}
        {items.length > 8 && <li className="text-xs text-slate-400">+{items.length - 8} more</li>}
      </ul>
    </div>
  );
}
