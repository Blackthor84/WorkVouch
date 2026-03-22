"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { VerifiedWorkersUnlockModal } from "./VerifiedWorkersUnlockModal";

type WorkerRow = {
  id: string;
  fullName: string;
  jobTitle: string;
  locationLabel: string;
  vouchCount: number;
  badge: string;
  statusLine: string;
  trustedHighlight: boolean;
  locked: boolean;
};

type ApiResponse = {
  workers: WorkerRow[];
  totalMatching: number;
  monetizationTier: string;
  visibleCap: number | null;
  lockedCount: number;
  filters: { state: string; jobType: string };
  messaging?: { scarcity?: string; unlock?: string };
  error?: string;
};

const JOB_TYPES = [
  { id: "all", label: "All job types" },
  { id: "security", label: "Security" },
  { id: "hospitality", label: "Hospitality" },
  { id: "healthcare", label: "Healthcare" },
] as const;

/** State-level only (privacy-safe). */
const STATE_OPTIONS = [
  { code: "NH", label: "New Hampshire" },
  { code: "MA", label: "Massachusetts" },
  { code: "ME", label: "Maine" },
  { code: "VT", label: "Vermont" },
  { code: "RI", label: "Rhode Island" },
  { code: "CT", label: "Connecticut" },
];

type Props = {
  planTier: string;
  userRole: string;
};

export function VerifiedWorkersDashboardClient({ planTier, userRole }: Props) {
  const [state, setState] = useState("NH");
  const [jobType, setJobType] = useState<string>("all");
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const isFree =
    (planTier === "free" || !planTier) && userRole !== "superadmin";
  const isStarter = planTier === "starter" || planTier === "basic" || planTier === "lite";
  const isProish =
    planTier === "pro" ||
    planTier === "custom" ||
    userRole === "superadmin" ||
    planTier === "enterprise" ||
    planTier === "team" ||
    planTier === "growth";

  const canFilterLocation = !isFree;
  const canFilterJobType = isStarter || isProish;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("state", state);
      params.set("jobType", jobType);
      const res = await fetch(`/api/employer/verified-workers?${params.toString()}`, {
        credentials: "include",
      });
      const json = (await res.json()) as ApiResponse;
      setData(json);
    } catch {
      setData({ workers: [], totalMatching: 0, monetizationTier: "free", visibleCap: 3, lockedCount: 0, filters: { state, jobType }, error: "Failed to load" });
    } finally {
      setLoading(false);
    }
  }, [state, jobType]);

  useEffect(() => {
    void load();
  }, [load]);

  const lockedCount = data?.lockedCount ?? 0;
  const showUpgradeStrip = lockedCount > 0 && (data?.visibleCap != null);

  const tierLabel = useMemo(() => {
    const t = (data?.monetizationTier || planTier || "free").toLowerCase();
    if (t === "pro") return "Pro";
    if (t === "starter") return "Starter";
    if (t === "custom") return "Custom";
    return "Free";
  }, [data?.monetizationTier, planTier]);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
            Verified workers
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Coworker-backed trust — not just resumes. Plan:{" "}
            <span className="font-semibold text-gray-900">{tierLabel}</span>
          </p>
        </div>
        <Link
          href="/employer/billing"
          className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50"
        >
          Billing &amp; plans
        </Link>
      </div>

      <div className="rounded-xl border border-amber-100 bg-amber-50/90 px-4 py-3 text-sm text-amber-950">
        <p className="font-medium">{data?.messaging?.scarcity}</p>
        {showUpgradeStrip ? (
          <p className="mt-1 text-amber-900/90">{data?.messaging?.unlock ?? "Upgrade to unlock full access"}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:flex-row sm:flex-wrap sm:items-end">
        <div className="min-w-[10rem] flex-1">
          <label htmlFor="vw-state" className="block text-xs font-semibold uppercase tracking-wide text-gray-500">
            Location
          </label>
          {canFilterLocation ? (
            <select
              id="vw-state"
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
            >
              {STATE_OPTIONS.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.label}
                </option>
              ))}
            </select>
          ) : (
            <p id="vw-state" className="mt-2 text-sm text-gray-700">
              New Hampshire <span className="text-gray-500">(upgrade to filter by state)</span>
            </p>
          )}
        </div>
        <div className="min-w-[10rem] flex-1">
          <label htmlFor="vw-job" className="block text-xs font-semibold uppercase tracking-wide text-gray-500">
            Job type
          </label>
          {canFilterJobType ? (
            <select
              id="vw-job"
              value={jobType}
              onChange={(e) => setJobType(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
            >
              {JOB_TYPES.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.label}
                </option>
              ))}
            </select>
          ) : (
            <p id="vw-job" className="mt-2 text-sm text-gray-700">
              All types <span className="text-gray-500">(Starter+ to filter)</span>
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-black"
        >
          Unlock full access
        </button>
      </div>

      {data?.error && !data.workers?.length ? (
        <p className="text-sm text-red-600">{data.error}</p>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="divide-y divide-gray-100">
          {loading ? (
            <p className="px-4 py-10 text-center text-sm text-gray-500">Loading verified workers…</p>
          ) : !data?.workers?.length ? (
            <p className="px-4 py-10 text-center text-sm text-gray-500">
              No workers match these filters yet. Try another state or job type.
            </p>
          ) : (
            data.workers.map((w) => (
              <div
                key={w.id}
                className={`px-4 py-4 sm:px-5 ${
                  w.trustedHighlight && !w.locked ? "bg-emerald-50/50" : ""
                } ${w.locked ? "bg-gray-50/80" : ""}`}
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className={w.locked ? "blur-[2px]" : ""}>
                    <p className="font-semibold text-gray-900">{w.locked ? "Hidden worker" : w.fullName}</p>
                    <p className="text-sm text-gray-600">{w.locked ? "—" : w.jobTitle}</p>
                    <p className="text-xs text-gray-500">Location: {w.locked ? "—" : w.locationLabel}</p>
                  </div>
                  <div className="flex flex-col items-start gap-1 sm:items-end">
                    <span className="inline-flex rounded-full border border-gray-200 bg-gray-50 px-2.5 py-0.5 text-xs font-semibold text-gray-800">
                      {w.locked ? "Locked" : `${w.vouchCount} vouch${w.vouchCount === 1 ? "" : "es"}`}
                    </span>
                    {!w.locked ? (
                      <>
                        <span className="text-xs font-medium text-gray-700">{w.badge}</span>
                        {w.statusLine ? (
                          <span className="text-sm text-gray-800">{w.statusLine}</span>
                        ) : null}
                        {w.trustedHighlight ? (
                          <span className="text-xs font-semibold text-emerald-800">Most trusted</span>
                        ) : null}
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setModalOpen(true)}
                        className="text-xs font-semibold text-gray-900 underline"
                      >
                        Unlock full access to verified workers
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {lockedCount > 0 && data?.visibleCap != null ? (
        <p className="text-center text-xs text-gray-500">
          Showing {data.visibleCap} of {data.totalMatching} workers in this view. Upgrade to see the rest.
        </p>
      ) : null}

      <VerifiedWorkersUnlockModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        monetizationTier={data?.monetizationTier ?? planTier ?? "free"}
      />
    </div>
  );
}
