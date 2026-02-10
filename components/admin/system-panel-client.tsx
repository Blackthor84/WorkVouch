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

  const onToggleMaintenance = () => {
    setSaving(true);
    const next = { ...maintenance, enabled: !maintenance.enabled };
    fetch("/api/admin/system/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ maintenance_mode: next }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setMaintenance(next);
      })
      .finally(() => setSaving(false));
  };

  if (loading) {
    return <Card className="p-6"><p className="text-grey-medium dark:text-gray-400">Loading system settings...</p></Card>;
  }

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold text-grey-dark dark:text-gray-200 mb-4">Maintenance Mode</h2>
      <p className="text-sm text-grey-medium dark:text-gray-400 mb-4">
        When enabled: prevent new signups, new reviews, new employment records; show maintenance banner.
      </p>
      <div className="flex items-center gap-4">
        <Button variant={maintenance.enabled ? "danger" : "primary"} size="sm" disabled={saving} onClick={onToggleMaintenance}>
          {maintenance.enabled ? "Disable maintenance mode" : "Enable maintenance mode"}
        </Button>
        <span className="text-sm text-grey-medium dark:text-gray-400">
          {maintenance.enabled ? "ON — signups/reviews/employment blocked" : "OFF"}
        </span>
      </div>
    </Card>
  );
}
