"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type MaintenanceState = {
  enabled: boolean;
  block_signups: boolean;
  block_reviews: boolean;
  block_employment: boolean;
  banner_message: string | null;
};

export function SystemPanelClient() {
  const [settings, setSettings] = useState<{ maintenance_mode?: MaintenanceState }>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [maintenance, setMaintenance] = useState<MaintenanceState>({
    enabled: false,
    block_signups: true,
    block_reviews: true,
    block_employment: true,
    banner_message: "System maintenance in progress.",
  });

  useEffect(() => {
    fetch("/api/admin/system/settings")
      .then((r) => r.json())
      .then((d) => {
        setSettings(d);
        const mm = d.maintenance_mode;
        if (mm && typeof mm === "object") {
          setMaintenance({
            enabled: !!mm.enabled,
            block_signups: mm.block_signups !== false,
            block_reviews: mm.block_reviews !== false,
            block_employment: mm.block_employment !== false,
            banner_message: mm.banner_message ?? "System maintenance in progress.",
          });
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [confirmWord, setConfirmWord] = useState("");

  const onToggleMaintenance = () => {
    if (!reason.trim()) return;
    setSaving(true);
    const next = { ...maintenance, enabled: !maintenance.enabled };
    fetch("/api/admin/system/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ maintenance_mode: next, reason: reason.trim() }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setMaintenance(next);
          setConfirmOpen(false);
          setReason("");
          setConfirmWord("");
        }
      })
      .finally(() => setSaving(false));
  };

  const wantEnable = !maintenance.enabled;
  const canConfirm = reason.trim().length >= 10 && (wantEnable ? confirmWord.toUpperCase() === "MAINTENANCE" : true);

  if (loading) {
    return <Card className="p-6"><p className="text-grey-medium dark:text-gray-400">Loading system settings...</p></Card>;
  }

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold text-grey-dark dark:text-gray-200 mb-4">Maintenance Mode</h2>
      <p className="text-sm text-grey-medium dark:text-gray-400 mb-4">
        When enabled: prevent new signups, new reviews, new employment records; show maintenance banner.
        Superadmin actions require a reason and are double-logged.
      </p>
      <div className="flex items-center gap-4">
        <Button
          variant={maintenance.enabled ? "danger" : "primary"}
          size="sm"
          disabled={saving}
          onClick={() => setConfirmOpen(true)}
        >
          {maintenance.enabled ? "Disable maintenance mode" : "Enable maintenance mode"}
        </Button>
        <span className="text-sm text-grey-medium dark:text-gray-400">
          {maintenance.enabled ? "ON — signups/reviews/employment blocked" : "OFF"}
        </span>
      </div>

      {confirmOpen && (
        <div className="mt-6 rounded-lg border-2 border-amber-300 bg-amber-50 p-4">
          <p className="font-semibold text-amber-900 mb-2">Confirm change</p>
          <p className="text-sm text-amber-800 mb-3">
            {wantEnable
              ? "Enabling maintenance will block signups, reviews, and employment. Type MAINTENANCE to confirm."
              : "Disabling will restore normal operation."}
          </p>
          <label className="block text-sm font-medium text-slate-700 mb-1">Reason (required)</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Deploying backend; expect 5 min downtime"
            className="w-full rounded border border-slate-300 p-2 text-sm mb-2 min-h-[60px]"
            rows={2}
          />
          {wantEnable && (
            <>
              <label className="block text-sm font-medium text-slate-700 mb-1">Type MAINTENANCE to confirm</label>
              <input
                type="text"
                value={confirmWord}
                onChange={(e) => setConfirmWord(e.target.value)}
                className="w-full rounded border border-slate-300 p-2 text-sm mb-2"
                placeholder="MAINTENANCE"
              />
            </>
          )}
          <div className="flex gap-2">
            <Button size="sm" disabled={!canConfirm || saving} onClick={onToggleMaintenance}>
              {saving ? "Saving…" : "Confirm"}
            </Button>
            <Button variant="secondary" size="sm" onClick={() => { setConfirmOpen(false); setReason(""); setConfirmWord(""); }}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
