"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";

interface ProductionOverrideBannerAndTriggerProps {
  overrideActive: boolean;
  overrideExpiresAt: string | null;
}

const CONFIRM_TEXT = "ENABLE PRODUCTION POWER";

export function ProductionOverrideBannerAndTrigger({
  overrideActive,
  overrideExpiresAt,
}: ProductionOverrideBannerAndTriggerProps) {
  const [open, setOpen] = useState(false);
  const [duration, setDuration] = useState<15 | 30 | 60>(30);
  const [reason, setReason] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(() => {
    window.dispatchEvent(new CustomEvent("admin-override-status-refresh"));
  }, []);

  const handleEnable = async () => {
    if (confirm.trim().toUpperCase() !== CONFIRM_TEXT) {
      setError(`Type "${CONFIRM_TEXT}" to confirm`);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/override/enable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ durationMinutes: duration, reason: reason.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error ?? "Failed to enable override");
        return;
      }
      setOpen(false);
      setReason("");
      setConfirm("");
      fetchStatus();
      window.location.reload();
    } finally {
      setLoading(false);
    }
  };

  const expiresLabel = overrideExpiresAt
    ? new Date(overrideExpiresAt).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" })
    : null;

  return (
    <>
      <div className="ml-auto flex items-center gap-2">
        {overrideActive ? (
          <span className="text-xs font-medium text-white/90" title={overrideExpiresAt ?? undefined}>
            Override until {expiresLabel ?? "—"}
          </span>
        ) : (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="bg-white/20 hover:bg-white/30 text-white border border-white/40"
            onClick={() => setOpen(true)}
          >
            Enable Production Admin Power
          </Button>
        )}
      </div>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="override-modal-title"
        >
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 id="override-modal-title" className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              Enable Production Admin Power
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              This temporarily enables Playground, abuse simulation, and generators in production. Override expires automatically.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Duration</label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value) as 15 | 30 | 60)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                >
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={60}>60 minutes</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Reason (required)</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Emergency test before release"
                  rows={2}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Type <strong>{CONFIRM_TEXT}</strong> to confirm
                </label>
                <input
                  type="text"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder={CONFIRM_TEXT}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm font-mono"
                />
              </div>
            </div>
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            <div className="mt-6 flex gap-2 justify-end">
              <Button type="button" variant="outline" size="sm" onClick={() => { setOpen(false); setError(null); }}>
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleEnable}
                disabled={loading || reason.trim().length < 3}
                className="bg-red-600 hover:bg-red-700"
              >
                {loading ? "Enabling…" : "Enable override"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
