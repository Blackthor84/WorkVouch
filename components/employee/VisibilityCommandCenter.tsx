"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type VisibilityOption = "visible_to_employers" | "verified_only" | "archived";

const OPTIONS: { value: VisibilityOption; label: string; microcopy: string }[] = [
  {
    value: "visible_to_employers",
    label: "Visible to employers",
    microcopy: "Your profile can appear in employer searches and directory listings. Employers with access can view your work history and references according to their plan.",
  },
  {
    value: "verified_only",
    label: "Visible only after verification",
    microcopy: "Employers only see your full profile after at least one employment or reference is verified. This can help protect your identity until you have verified credentials.",
  },
  {
    value: "archived",
    label: "Archived",
    microcopy: "Your profile is hidden from employer search and directory. You will not appear in candidate results. You can switch back anytime.",
  },
];

export function VisibilityCommandCenter() {
  const [visibility, setVisibility] = useState<VisibilityOption | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/user/profile-visibility", { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load");
        return res.json();
      })
      .then((data: { visibility?: VisibilityOption }) => {
        if (!cancelled && data.visibility) setVisibility(data.visibility);
        else if (!cancelled) setVisibility("visible_to_employers");
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSelect = async (value: VisibilityOption) => {
    if (visibility === value || saving) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/user/profile-visibility", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ visibility: value }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data as { error?: string }).error ?? "Failed to update");
      setVisibility(value);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Profile Visibility</h2>
        <p className="text-sm text-slate-500">Loading…</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1">Profile Visibility</h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
        Control how employers discover and view your profile. Changes apply immediately to Employer View Mirror, employer search, and shared credentials.
      </p>
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 mb-4">{error}</p>
      )}
      <div className="space-y-4">
        {OPTIONS.map((opt) => (
          <div
            key={opt.value}
            className={`rounded-lg border p-4 transition-colors ${
              visibility === opt.value
                ? "border-blue-500 bg-blue-50/50 dark:bg-blue-900/10 dark:border-blue-600"
                : "border-slate-200 dark:border-slate-700"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-slate-900 dark:text-slate-100">{opt.label}</p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{opt.microcopy}</p>
              </div>
              <Button
                variant={visibility === opt.value ? "secondary" : "outline"}
                size="sm"
                disabled={saving || visibility === opt.value}
                onClick={() => handleSelect(opt.value)}
              >
                {visibility === opt.value ? "Current" : "Select"}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
