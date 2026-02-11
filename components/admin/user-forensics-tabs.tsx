"use client";

import { useState, useEffect, ReactNode } from "react";
import { cn } from "@/lib/utils";

export type ForensicsTabId =
  | "overview"
  | "employment"
  | "peer-reviews"
  | "intelligence"
  | "fraud"
  | "audit"
  | "sessions"
  | "payment";

const TABS: { id: ForensicsTabId; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "employment", label: "Employment Records" },
  { id: "peer-reviews", label: "Peer Reviews" },
  { id: "intelligence", label: "Intelligence" },
  { id: "fraud", label: "Fraud Signals" },
  { id: "audit", label: "Audit Log" },
  { id: "sessions", label: "Session Activity" },
  { id: "payment", label: "Payment & Plan" },
];

interface UserForensicsTabsProps {
  userId: string;
  isEmployer: boolean;
  overviewContent: ReactNode;
}

export function UserForensicsTabs({ userId, isEmployer, overviewContent }: UserForensicsTabsProps) {
  const [tab, setTab] = useState<ForensicsTabId>("overview");
  const [employment, setEmployment] = useState<Record<string, unknown>[]>([]);
  const [peerReviews, setPeerReviews] = useState<Record<string, unknown>[]>([]);
  const [intelligence, setIntelligence] = useState<unknown>(null);
  const [fraudSignals, setFraudSignals] = useState<Record<string, unknown>[]>([]);
  const [auditLog, setAuditLog] = useState<Record<string, unknown>[]>([]);
  const [activity, setActivity] = useState<Record<string, unknown>[]>([]);
  const [breakdown, setBreakdown] = useState<Record<string, unknown> | null>(null);
  const [scoreHistory, setScoreHistory] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    if (tab === "employment") {
      setLoading("employment");
      fetch(`/api/admin/users/${userId}/employment`)
        .then((r) => r.json())
        .then((d) => setEmployment(Array.isArray(d) ? (d as Record<string, unknown>[]) : []))
        .finally(() => setLoading(null));
    }
  }, [tab, userId]);

  useEffect(() => {
    if (tab === "peer-reviews") {
      setLoading("peer-reviews");
      fetch(`/api/admin/users/${userId}/peer-reviews`)
        .then((r) => r.json())
        .then((d) => setPeerReviews(Array.isArray(d) ? d : []))
        .finally(() => setLoading(null));
    }
  }, [tab, userId]);

  useEffect(() => {
    if (tab === "intelligence") {
      setLoading("intelligence");
      Promise.all([
        fetch(`/api/admin/users/${userId}`).then((r) => r.json()),
        fetch(`/api/admin/users/${userId}/intelligence-breakdown`).then((r) => r.json()),
        fetch(`/api/admin/users/${userId}/score-history`).then((r) => r.json()),
      ])
        .then(([userData, breakdownData, historyData]) => {
          setIntelligence(userData);
          setBreakdown(breakdownData.breakdown ?? null);
          setScoreHistory(Array.isArray(historyData) ? (historyData as Record<string, unknown>[]) : []);
        })
        .finally(() => setLoading(null));
    }
  }, [tab, userId]);

  useEffect(() => {
    if (tab === "fraud") {
      setLoading("fraud");
      fetch(`/api/admin/users/${userId}/fraud-signals`)
        .then((r) => r.json())
        .then((d) => setFraudSignals(Array.isArray(d) ? (d as Record<string, unknown>[]) : []))
        .finally(() => setLoading(null));
    }
  }, [tab, userId]);

  useEffect(() => {
    if (tab === "audit") {
      setLoading("audit");
      fetch(`/api/admin/users/${userId}/audit-log`)
        .then((r) => r.json())
        .then((d) => setAuditLog(Array.isArray(d) ? d : []))
        .finally(() => setLoading(null));
    }
  }, [tab, userId]);

  useEffect(() => {
    if (tab === "sessions" || tab === "overview") {
      if (tab === "sessions") {
        setLoading("activity");
        fetch(`/api/admin/users/${userId}/activity`)
          .then((r) => r.json())
          .then((d) => setActivity(Array.isArray(d) ? (d as Record<string, unknown>[]) : []))
          .finally(() => setLoading(null));
      }
    }
  }, [tab, userId]);

  const visibleTabs = TABS.filter((t) => t.id !== "payment" || isEmployer);

  return (
    <div className="mt-6">
      <div className="border-b border-grey-background dark:border-[#374151] mb-4">
        <nav className="flex flex-wrap gap-1 -mb-px">
          {visibleTabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                tab === t.id
                  ? "border-blue-600 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-grey-medium dark:text-gray-400 hover:text-grey-dark dark:hover:text-gray-200"
              )}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      {tab === "overview" && overviewContent}

      {tab === "employment" && (
        <div className="rounded-xl border border-grey-background dark:border-[#374151] bg-white dark:bg-[#111827] p-6">
          <h3 className="text-lg font-semibold text-grey-dark dark:text-gray-200 mb-4">Employment Records</h3>
          {loading === "employment" ? (
            <p className="text-grey-medium dark:text-gray-400">Loading...</p>
          ) : employment.length === 0 ? (
            <p className="text-grey-medium dark:text-gray-400">No employment records.</p>
          ) : (
            <ul className="space-y-3">
              {employment.map((r: Record<string, unknown>, i) => (
                <li key={(r.id as string) ?? i} className="text-sm border-b border-grey-background/50 dark:border-[#374151]/50 pb-2">
                  <span className="font-medium text-grey-dark dark:text-gray-200">{r.company_name as string}</span>
                  {" — "}
                  <span>{r.job_title as string}</span>
                  {" · "}
                  <span className="text-grey-medium dark:text-gray-400">
                    {r.start_date ? new Date(r.start_date as string).toLocaleDateString() : "—"} – {r.end_date ? new Date(r.end_date as string).toLocaleDateString() : "present"}
                  </span>
                  {" · "}
                  <span className="capitalize">{String(r.verification_status ?? "—")}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {tab === "peer-reviews" && (
        <div className="rounded-xl border border-grey-background dark:border-[#374151] bg-white dark:bg-[#111827] p-6">
          <h3 className="text-lg font-semibold text-grey-dark dark:text-gray-200 mb-4">Peer Reviews</h3>
          {loading === "peer-reviews" ? (
            <p className="text-grey-medium dark:text-gray-400">Loading...</p>
          ) : peerReviews.length === 0 ? (
            <p className="text-grey-medium dark:text-gray-400">No peer reviews.</p>
          ) : (
            <ul className="space-y-3">
              {peerReviews.map((r, i) => (
                <li key={(r.id as string) ?? i} className="text-sm border-b border-grey-background/50 dark:border-[#374151]/50 pb-2">
                  Rating: <strong>{String(r.rating)}</strong>
                  {r.comment ? ` · ${String(r.comment).slice(0, 80)}${String(r.comment).length > 80 ? "…" : ""}` : null}
                  {" · "}
                  <span className="text-grey-medium dark:text-gray-400">{r.created_at ? new Date(r.created_at as string).toLocaleString() : ""}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {tab === "intelligence" && (
        <div className="rounded-xl border border-grey-background dark:border-[#374151] bg-white dark:bg-[#111827] p-6">
          <h3 className="text-lg font-semibold text-grey-dark dark:text-gray-200 mb-4">Intelligence (full breakdown)</h3>
          {loading === "intelligence" ? (
            <p className="text-grey-medium dark:text-gray-400">Loading...</p>
          ) : intelligence && typeof intelligence === "object" ? (
            <>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm mb-4">
                <div><dt className="text-grey-medium dark:text-gray-400">Profile strength</dt><dd className="font-medium">{(intelligence as { profile_strength?: number }).profile_strength ?? "—"}</dd></div>
              </dl>
              {breakdown && typeof breakdown === "object" && (
                <div className="mt-4 pt-4 border-t border-grey-background dark:border-[#374151]">
                  <h4 className="text-sm font-semibold text-grey-dark dark:text-gray-200 mb-2">Breakdown</h4>
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                    <div><dt className="text-grey-medium dark:text-gray-400">Tenure strength</dt><dd className="font-medium">{String(breakdown.tenureStrength ?? "—")}</dd></div>
                    <div><dt className="text-grey-medium dark:text-gray-400">Volume strength</dt><dd className="font-medium">{String(breakdown.volumeStrength ?? "—")}</dd></div>
                    <div><dt className="text-grey-medium dark:text-gray-400">Sentiment strength</dt><dd className="font-medium">{String(breakdown.sentimentStrength ?? "—")}</dd></div>
                    <div><dt className="text-grey-medium dark:text-gray-400">Rating strength</dt><dd className="font-medium">{String(breakdown.ratingStrength ?? "—")}</dd></div>
                    <div><dt className="text-grey-medium dark:text-gray-400">Rehire multiplier</dt><dd className="font-medium">{String(breakdown.rehireMultiplier ?? "—")}</dd></div>
                    <div><dt className="text-grey-medium dark:text-gray-400">Raw score</dt><dd className="font-medium">{String(breakdown.rawScore ?? "—")}</dd></div>
                    <div><dt className="text-grey-medium dark:text-gray-400">Final score</dt><dd className="font-medium">{String(breakdown.finalScore ?? "—")}</dd></div>
                    <div><dt className="text-grey-medium dark:text-gray-400">Version used</dt><dd className="font-medium">{String(breakdown.versionUsed ?? "—")}</dd></div>
                  </dl>
                </div>
              )}
              {scoreHistory.length > 0 && (
                <div className="mt-4 pt-4 border-t border-grey-background dark:border-[#374151]">
                  <h4 className="text-sm font-semibold text-grey-dark dark:text-gray-200 mb-2">Score diff history</h4>
                  <ul className="space-y-2 text-sm">
                    {scoreHistory.map((h: Record<string, unknown>, i) => (
                      <li key={(h.id as string) ?? i} className="flex flex-wrap gap-x-2 gap-y-1 border-b border-grey-background/50 dark:border-[#374151]/50 pb-2">
                        <span className="text-grey-medium dark:text-gray-400">Old: {h.previous_score != null ? String(h.previous_score) : "—"}</span>
                        <span className="text-grey-medium dark:text-gray-400">→ New: {String(h.new_score ?? "—")}</span>
                        {h.delta != null && <span className="text-grey-medium dark:text-gray-400">(Δ {String(h.delta)})</span>}
                        <span className="font-medium text-grey-dark dark:text-gray-200">{String(h.reason ?? "—")}</span>
                        <span className="text-grey-medium dark:text-gray-400">{h.created_at ? new Date(h.created_at as string).toLocaleString() : ""}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ) : (
            <p className="text-grey-medium dark:text-gray-400">No intelligence data.</p>
          )}
        </div>
      )}

      {tab === "fraud" && (
        <div className="rounded-xl border border-grey-background dark:border-[#374151] bg-white dark:bg-[#111827] p-6">
          <h3 className="text-lg font-semibold text-grey-dark dark:text-gray-200 mb-4">Fraud Signals</h3>
          {loading === "fraud" ? (
            <p className="text-grey-medium dark:text-gray-400">Loading...</p>
          ) : fraudSignals.length === 0 ? (
            <p className="text-grey-medium dark:text-gray-400">No fraud signals.</p>
          ) : (
            <ul className="space-y-2">
              {fraudSignals.map((s, i) => (
                <li key={(s.id as string) ?? i} className="text-sm">
                  <span className="font-medium text-red-600 dark:text-red-400">{String(s.signal_type)}</span>
                  {" · "}
                  <span className="text-grey-medium dark:text-gray-400">{s.created_at ? new Date(s.created_at as string).toLocaleString() : ""}</span>
                  {s.metadata && typeof s.metadata === "object" ? (
                    <pre className="mt-1 text-xs bg-grey-background/50 dark:bg-[#1A1F2B] p-2 rounded overflow-auto">{JSON.stringify(s.metadata, null, 2)}</pre>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {tab === "audit" && (
        <div className="rounded-xl border border-grey-background dark:border-[#374151] bg-white dark:bg-[#111827] p-6">
          <h3 className="text-lg font-semibold text-grey-dark dark:text-gray-200 mb-4">Audit Log</h3>
          {loading === "audit" ? (
            <p className="text-grey-medium dark:text-gray-400">Loading...</p>
          ) : auditLog.length === 0 ? (
            <p className="text-grey-medium dark:text-gray-400">No audit entries.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {auditLog.map((a: Record<string, unknown>, i) => (
                <li key={(a.id as string) ?? i} className="border-b border-grey-background/50 dark:border-[#374151]/50 pb-2">
                  <span className="font-medium">{String(a.action)}</span>
                  {" · "}
                  <span className="text-grey-medium dark:text-gray-400">{a.created_at ? new Date(a.created_at as string).toLocaleString() : ""}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {tab === "sessions" && (
        <div className="rounded-xl border border-grey-background dark:border-[#374151] bg-white dark:bg-[#111827] p-6">
          <h3 className="text-lg font-semibold text-grey-dark dark:text-gray-200 mb-4">Session Activity (Event Timeline)</h3>
          {loading === "activity" ? (
            <p className="text-grey-medium dark:text-gray-400">Loading...</p>
          ) : activity.length === 0 ? (
            <p className="text-grey-medium dark:text-gray-400">No activity logged yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {activity.map((e, i) => (
                <li key={(e.id as string) ?? i} className="flex gap-2 border-b border-grey-background/50 dark:border-[#374151]/50 pb-2">
                  <span className="font-medium shrink-0">{String(e.type)}</span>
                  <span className="text-grey-medium dark:text-gray-400 shrink-0">{e.created_at ? new Date(e.created_at as string).toLocaleString() : ""}</span>
                  {e.metadata && typeof e.metadata === "object" && Object.keys(e.metadata as object).length > 0 ? (
                    <span className="text-grey-medium dark:text-gray-400 truncate">{JSON.stringify(e.metadata)}</span>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {tab === "payment" && isEmployer && (
        <div className="rounded-xl border border-grey-background dark:border-[#374151] bg-white dark:bg-[#111827] p-6">
          <h3 className="text-lg font-semibold text-grey-dark dark:text-gray-200 mb-4">Payment & Plan</h3>
          <p className="text-grey-medium dark:text-gray-400">Subscription and billing data for this employer. (Override controls in Employer Admin.)</p>
        </div>
      )}
    </div>
  );
}
