"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { usePreview, type PreviewState } from "@/lib/preview-context";

type FeatureFlagRow = { id: string; key: string; name: string; description: string | null };
type PreviewRole = "user" | "employer" | "admin";

const PLAN_TIERS = ["starter", "pro", "team", "enterprise", "security_bundle"] as const;
const ROLES: { value: PreviewRole; label: string }[] = [
  { value: "user", label: "User" },
  { value: "employer", label: "Employer" },
  { value: "admin", label: "Admin" },
];

type SalesMode = "sales_demo" | "investor" | "internal_qa";
const SALES_MODES: { id: SalesMode; label: string; role: PreviewRole; plan: string; features: string[] }[] = [
  {
    id: "sales_demo",
    label: "Sales Demo Mode",
    role: "employer",
    plan: "pro",
    features: ["advanced_analytics", "ads_system", "rehire_probability_index"],
  },
  {
    id: "investor",
    label: "Investor Mode",
    role: "employer",
    plan: "enterprise",
    features: ["advanced_analytics", "ads_system", "rehire_probability_index", "team_compatibility_scoring", "workforce_risk_indicator"],
  },
  {
    id: "internal_qa",
    label: "Internal QA Mode",
    role: "employer",
    plan: "pro",
    features: [],
  },
];

export default function PreviewControlPage() {
  const { preview, setPreview, setPreviewValue } = usePreview();
  const [flags, setFlags] = useState<FeatureFlagRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFlags = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/feature-flags", { credentials: "include" });
      if (!res.ok) return;
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      setFlags(list.map((f: { id: string; key: string; name: string; description: string | null }) => ({ id: f.id, key: f.key, name: f.name, description: f.description })));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFlags();
  }, [fetchFlags]);

  const toggleFeature = (key: string, enabled: boolean) => {
    setPreviewValue("previewFeatures", { ...(preview?.previewFeatures ?? {}), [key]: enabled });
    if (enabled) {
      setPreviewValue("featureFlags", [...(preview?.featureFlags ?? []).filter((f) => f !== key), key]);
    } else {
      setPreviewValue("featureFlags", (preview?.featureFlags ?? []).filter((f) => f !== key));
    }
  };

  const toggleExpired = (checked: boolean) => {
    setPreviewValue("previewExpired", checked);
    setPreviewValue("simulateExpired", checked);
  };

  const setSeatUsage = (v: string) => {
    const parsed = parseInt(v, 10);
    const value = Number.isFinite(parsed) ? parsed : undefined;
    setPreviewValue("previewSeatUsage", value);
    setPreviewValue("seatsUsed", value);
  };

  const setReportsUsed = (v: string) => {
    const parsed = parseInt(v, 10);
    const value = Number.isFinite(parsed) ? parsed : undefined;
    setPreviewValue("previewReportsUsed", value);
    setPreviewValue("reportsUsed", value);
  };

  const setRiskOverride = (v: string) => {
    const n = v === "" ? undefined : parseFloat(v);
    setPreviewValue("previewSimulationData", {
      ...(preview?.previewSimulationData ?? {}),
      riskOverride: Number.isFinite(n) ? n : undefined,
    });
  };

  const resetSimulation = () => {
    setPreview(null);
  };

  const activatePreview = () => {
    const state: Partial<PreviewState> = {
      demoActive: true,
      role: preview?.previewRole ?? "employer",
      subscription: preview?.previewPlanTier ?? preview?.subscription ?? "pro",
      previewRole: (preview?.previewRole ?? "employer") as PreviewRole,
      previewPlanTier: preview?.previewPlanTier ?? preview?.subscription ?? "pro",
      featureFlags: preview?.featureFlags ?? [],
      previewFeatures: preview?.previewFeatures ?? {},
      simulateExpired: preview?.previewExpired ?? preview?.simulateExpired ?? false,
      previewExpired: preview?.previewExpired ?? false,
      seatsUsed: preview?.previewSeatUsage ?? preview?.seatsUsed ?? 3,
      previewSeatUsage: preview?.previewSeatUsage ?? undefined,
      reportsUsed: preview?.previewReportsUsed ?? preview?.reportsUsed ?? 5,
      previewReportsUsed: preview?.previewReportsUsed ?? undefined,
      previewSimulationData: preview?.previewSimulationData ?? {},
    };
    setPreview(state as PreviewState);
  };

  const applySalesMode = (mode: (typeof SALES_MODES)[number]) => {
    const featureObj: Record<string, boolean> = {};
    mode.features.forEach((k) => { featureObj[k] = true; });
    setPreviewValue("previewRole", mode.role);
    setPreviewValue("role", mode.role);
    setPreviewValue("previewPlanTier", mode.plan);
    setPreviewValue("subscription", mode.plan);
    setPreviewValue("featureFlags", mode.features);
    setPreviewValue("previewFeatures", featureObj);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-grey-dark dark:text-gray-200">Preview &amp; Simulation Control</h1>
          <p className="text-sm text-grey-medium dark:text-gray-400 mt-1">
            Simulate roles, plans, features, and limits. Client-side only; no DB changes.
          </p>
        </div>
        <Link href="/admin">
          <Button variant="secondary">Back to Admin</Button>
        </Link>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <h2 className="text-lg font-semibold text-grey-dark dark:text-gray-200">Sales Mode</h2>
          <p className="text-sm text-grey-medium dark:text-gray-400">Apply preset simulations for demos.</p>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {SALES_MODES.map((mode) => (
            <Button
              key={mode.id}
              variant="ghost"
              onClick={() => applySalesMode(mode)}
              className="border-grey-background dark:border-[#374151]"
            >
              {mode.label}
            </Button>
          ))}
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <h2 className="text-lg font-semibold text-grey-dark dark:text-gray-200">Role &amp; Plan</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-grey-dark dark:text-gray-300">Role</Label>
            <select
              value={preview?.previewRole ?? preview?.role ?? "employer"}
              onChange={(e) => {
                setPreviewValue("previewRole", e.target.value as PreviewRole);
                setPreviewValue("role", e.target.value);
              }}
              className="mt-1 w-full rounded-lg border border-grey-background dark:border-[#374151] bg-white dark:bg-[#111827] px-3 py-2 text-grey-dark dark:text-gray-200"
            >
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
          <div>
            <Label className="text-grey-dark dark:text-gray-300">Plan Tier</Label>
            <select
              value={preview?.previewPlanTier ?? preview?.subscription ?? "pro"}
              onChange={(e) => {
                setPreviewValue("previewPlanTier", e.target.value);
                setPreviewValue("subscription", e.target.value);
              }}
              className="mt-1 w-full rounded-lg border border-grey-background dark:border-[#374151] bg-white dark:bg-[#111827] px-3 py-2 text-grey-dark dark:text-gray-200"
            >
              {PLAN_TIERS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <h2 className="text-lg font-semibold text-grey-dark dark:text-gray-200">Feature Flags</h2>
          <p className="text-sm text-grey-medium dark:text-gray-400">Toggle features for preview (simulation only).</p>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-grey-medium dark:text-gray-400">Loading flags…</p>
          ) : (
            <ul className="space-y-2 max-h-64 overflow-y-auto">
              {flags.map((f) => (
                <li key={f.id} className="flex items-center justify-between gap-4 py-1 border-b border-grey-background dark:border-[#374151] last:border-0">
                  <span className="text-sm text-grey-dark dark:text-gray-200">{f.name || f.key}</span>
                  <Switch
                    checked={preview?.previewFeatures?.[f.key] ?? preview?.featureFlags?.includes(f.key) ?? false}
                    onCheckedChange={(checked) => toggleFeature(f.key, checked)}
                  />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <h2 className="text-lg font-semibold text-grey-dark dark:text-gray-200">Subscription &amp; Usage</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-grey-dark dark:text-gray-300">Expired subscription</Label>
            <Switch
              checked={preview?.previewExpired ?? preview?.simulateExpired ?? false}
              onCheckedChange={toggleExpired}
            />
          </div>
          <div>
            <Label className="text-grey-dark dark:text-gray-300">Seat usage (override)</Label>
            <Input
              type="number"
              min={0}
              value={preview?.previewSeatUsage ?? preview?.seatsUsed ?? ""}
              onChange={(e) => setSeatUsage(e.target.value)}
              placeholder="e.g. 10"
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-grey-dark dark:text-gray-300">Reports used (override)</Label>
            <Input
              type="number"
              min={0}
              value={preview?.previewReportsUsed ?? preview?.reportsUsed ?? ""}
              onChange={(e) => setReportsUsed(e.target.value)}
              placeholder="e.g. 20"
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-grey-dark dark:text-gray-300">Risk score override (0–100)</Label>
            <Input
              type="number"
              min={0}
              max={100}
              step={0.1}
              value={(preview?.previewSimulationData?.riskOverride as number | undefined) ?? ""}
              onChange={(e) => setRiskOverride(e.target.value)}
              placeholder="e.g. 75"
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-4">
        <Button onClick={activatePreview}>Apply Preview</Button>
        <Button variant="secondary" onClick={resetSimulation}>Reset Simulation</Button>
      </div>
    </div>
  );
}
