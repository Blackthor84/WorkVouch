"use client";

import { useCallback, useEffect, useState } from "react";

export type ResumeRequestRow = {
  id: string;
  candidate_id: string;
  status: string;
  created_at: string;
  candidate_name?: string;
};

type Props = {
  refreshToken?: number;
};

/**
 * Lists resume access requests for the signed-in employer.
 */
export function ResumeRequests({ refreshToken = 0 }: Props) {
  const [requests, setRequests] = useState<ResumeRequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/employer/resume-requests", {
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Failed to load");
        setRequests([]);
        return;
      }
      setRequests((data.requests as ResumeRequestRow[]) ?? []);
    } catch {
      setError("Failed to load");
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load, refreshToken]);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900/40">
      <h3 className="text-lg font-semibold text-grey-dark dark:text-gray-200">
        Resume access requests
      </h3>
      <p className="text-sm text-grey-medium dark:text-gray-400 mt-1">
        Requests you&apos;ve sent appear here with status{" "}
        <span className="font-medium">pending</span> until the candidate responds.
      </p>

      {error && (
        <p className="mt-3 text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <p className="mt-4 text-sm text-grey-medium dark:text-gray-400">Loading…</p>
      ) : requests.length === 0 ? (
        <p className="mt-4 text-sm text-grey-medium dark:text-gray-400">
          No requests yet. Use &quot;Request resume access&quot; on a candidate card
          above.
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-gray-100 dark:divide-gray-800 rounded-lg border border-gray-100 dark:border-gray-800 overflow-hidden">
          {requests.map((r) => (
            <li
              key={r.id}
              className="flex flex-wrap items-center justify-between gap-2 bg-white px-4 py-3 dark:bg-gray-950/30"
            >
              <div>
                <p className="font-medium text-grey-dark dark:text-gray-200">
                  {r.candidate_name ?? "Candidate"}
                </p>
                <p className="text-xs text-grey-medium dark:text-gray-500">
                  {new Date(r.created_at).toLocaleString(undefined, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
              </div>
              <span
                className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  r.status === "pending"
                    ? "bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-200"
                    : "bg-slate-100 text-slate-700 dark:bg-gray-800 dark:text-gray-300"
                }`}
              >
                {r.status}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
