"use client";

import { useCallback, useEffect, useState } from "react";
import { useSupabaseSession } from "@/lib/hooks/useSupabaseSession";

export type SavedCalculationRow = {
  id: string;
  salary: number;
  training_weeks: number;
  replacement_weeks: number;
  total_cost: number;
  created_at: string;
};

type Props = {
  /** Increment to refetch after a new save. */
  refreshToken?: number;
};

export default function SavedHiringCalculations({ refreshToken = 0 }: Props) {
  const { data: { user }, status } = useSupabaseSession();
  const [items, setItems] = useState<SavedCalculationRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user?.id) {
      setItems([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/hiring-calculations", {
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Failed to load");
        setItems([]);
        return;
      }
      setItems((data.calculations as SavedCalculationRow[]) ?? []);
    } catch {
      setError("Failed to load");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (status === "loading") return;
    void load();
  }, [status, load, refreshToken]);

  if (status === "loading") {
    return (
      <div className="rounded-xl border border-gray-200 bg-gray-50/80 p-6 text-center text-sm text-gray-500">
        Loading saved calculations…
      </div>
    );
  }

  if (!user) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50/50 p-6 text-center text-sm text-gray-600">
        Sign in to save and review past hiring impact scenarios.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-1">
        Saved calculations
      </h3>
      <p className="text-sm text-gray-500 mb-4">
        Your recent scenarios (newest first).
      </p>

      {error && (
        <p className="text-sm text-red-600 mb-3" role="alert">
          {error}
        </p>
      )}

      {loading && items.length === 0 ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-gray-500">
          No saved runs yet. Use &quot;Save calculation&quot; above.
        </p>
      ) : (
        <ul className="space-y-3 max-h-72 overflow-y-auto pr-1">
          {items.map((row) => (
            <li
              key={row.id}
              className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 text-sm"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="font-medium text-gray-900">
                  ${row.total_cost.toLocaleString()}{" "}
                  <span className="font-normal text-gray-500">total</span>
                </span>
                <time
                  className="text-xs text-gray-500"
                  dateTime={row.created_at}
                >
                  {new Date(row.created_at).toLocaleString(undefined, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </time>
              </div>
              <p className="mt-1 text-gray-600">
                Salary ${row.salary.toLocaleString()} · Training{" "}
                {row.training_weeks} wk · Replacement {row.replacement_weeks}{" "}
                wk
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
