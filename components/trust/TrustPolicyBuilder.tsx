"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldCheckIcon } from "@heroicons/react/24/outline";

export interface TrustPolicyBuilderProps {
  onCreated?: () => void;
}

const DEPTH_OPTIONS = [
  { value: "", label: "Any" },
  { value: "weak", label: "Weak" },
  { value: "moderate", label: "Moderate" },
  { value: "strong", label: "Strong" },
];

const REFERENCE_OPTIONS = [
  { value: "", label: "None" },
  { value: "manager", label: "Manager" },
  { value: "coworker", label: "Coworker" },
  { value: "client", label: "Client" },
];

export function TrustPolicyBuilder({ onCreated }: TrustPolicyBuilderProps) {
  const [policyName, setPolicyName] = useState("");
  const [minTrustScore, setMinTrustScore] = useState(75);
  const [minVerificationCoverage, setMinVerificationCoverage] = useState(70);
  const [requiredReferenceType, setRequiredReferenceType] = useState("");
  const [minTrustGraphDepth, setMinTrustGraphDepth] = useState("moderate");
  const [allowRecentDisputes, setAllowRecentDisputes] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/employer/policies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          policy_name: policyName.trim(),
          min_trust_score: minTrustScore,
          min_verification_coverage: minVerificationCoverage,
          required_reference_type: requiredReferenceType || null,
          min_trust_graph_depth: minTrustGraphDepth || null,
          allow_recent_disputes: allowRecentDisputes,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to create policy");
        return;
      }
      setPolicyName("");
      setMinTrustScore(75);
      setMinVerificationCoverage(70);
      setRequiredReferenceType("");
      setMinTrustGraphDepth("moderate");
      setAllowRecentDisputes(false);
      onCreated?.();
    } catch {
      setError("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1 flex items-center gap-2">
        <ShieldCheckIcon className="h-5 w-5" />
        Create Trusted Hire Archetype
      </h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
        Define what a trusted professional looks like for your organization. Candidates are
        evaluated against these standards—not job listings.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Policy name
          </label>
          <input
            type="text"
            value={policyName}
            onChange={(e) => setPolicyName(e.target.value)}
            placeholder="e.g. Trusted Security Supervisor"
            className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm"
            required
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Min. trust score (0–100)
            </label>
            <input
              type="number"
              min={0}
              max={100}
              value={minTrustScore}
              onChange={(e) => setMinTrustScore(Number(e.target.value) || 0)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Min. verification coverage (%)
            </label>
            <input
              type="number"
              min={0}
              max={100}
              value={minVerificationCoverage}
              onChange={(e) => setMinVerificationCoverage(Number(e.target.value) || 0)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Required reference type
            </label>
            <select
              value={requiredReferenceType}
              onChange={(e) => setRequiredReferenceType(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm"
            >
              {REFERENCE_OPTIONS.map((o) => (
                <option key={o.value || "none"} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Min. trust graph depth
            </label>
            <select
              value={minTrustGraphDepth}
              onChange={(e) => setMinTrustGraphDepth(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm"
            >
              {DEPTH_OPTIONS.map((o) => (
                <option key={o.value || "any"} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="allow_disputes"
            checked={allowRecentDisputes}
            onChange={(e) => setAllowRecentDisputes(e.target.checked)}
            className="rounded border-slate-300 dark:border-slate-600"
          />
          <label htmlFor="allow_disputes" className="text-sm text-slate-700 dark:text-slate-300">
            Allow candidates with recent disputes (within 180 days)
          </label>
        </div>
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
        <Button type="submit" disabled={submitting}>
          {submitting ? "Creating…" : "Create policy"}
        </Button>
      </form>
    </Card>
  );
}
