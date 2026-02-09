"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

type VerticalItem = {
  id?: string;
  name: string;
  displayName: string;
  enabled: boolean;
  created_at?: string;
};

export function VerticalControlClient() {
  const [verticals, setVerticals] = useState<VerticalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);

  const fetchVerticals = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/vertical-control", { credentials: "include" });
      const data = await res.json();
      if (data.verticals) setVerticals(data.verticals);
    } catch (e) {
      console.error("Failed to fetch verticals:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVerticals();
  }, [fetchVerticals]);

  const toggle = async (name: string, enabled: boolean) => {
    setToggling(name);
    try {
      const res = await fetch("/api/admin/vertical-control", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name, enabled: !enabled }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to update");
      }
      await fetchVerticals();
    } catch (e) {
      console.error("Toggle error:", e);
      alert(e instanceof Error ? e.message : "Failed to update");
    } finally {
      setToggling(null);
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <p className="text-grey-medium dark:text-gray-400">Loading verticals…</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold text-grey-dark dark:text-gray-200 mb-2">
        Vertical Activation
      </h2>
      <p className="text-sm text-grey-medium dark:text-gray-400 mb-6">
        When disabled: onboarding fields, badges, and monetization upgrades for that vertical are hidden. Data and DB remain supported.
      </p>
      <ul className="space-y-4">
        {verticals.map((v) => (
          <li
            key={v.name}
            className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-4 py-3"
          >
            <div>
              <span className="font-medium text-grey-dark dark:text-gray-200">
                {v.displayName}
              </span>
              <span className="ml-2 text-sm text-grey-medium dark:text-gray-400">
                ({v.name})
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Label className="text-sm text-grey-medium dark:text-gray-400">
                {v.enabled ? "Enabled" : "Disabled"}
              </Label>
              <Button
                size="sm"
                variant={v.enabled ? "destructive" : "default"}
                disabled={toggling === v.name}
                onClick={() => toggle(v.name, v.enabled)}
              >
                {toggling === v.name ? "…" : v.enabled ? "Disable" : "Enable"}
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
