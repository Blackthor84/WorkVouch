"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getIndustriesForSignup } from "@/lib/constants/industries";

const STORAGE_KEY = "employer_onboarding_draft";
const STEPS = ["org_name", "industry", "org_size", "admin_email", "confirm"] as const;
const ORG_SIZES = [
  { value: "1", label: "Just me" },
  { value: "2-10", label: "2–10 employees" },
  { value: "11-50", label: "11–50 employees" },
  { value: "51+", label: "51+ employees" },
] as const;

type Draft = {
  orgName: string;
  industry: string;
  orgSize: string;
  primaryAdminEmail: string;
};

const defaultDraft: Draft = {
  orgName: "",
  industry: "",
  orgSize: "",
  primaryAdminEmail: "",
};

function loadDraft(): Draft {
  if (typeof window === "undefined") return defaultDraft;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Draft>;
      return { ...defaultDraft, ...parsed };
    }
  } catch {
    // ignore
  }
  return defaultDraft;
}

function saveDraft(d: Draft) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(d));
  } catch {
    // ignore
  }
}

function clearDraft() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function EmployerOnboardingClient({ userEmail }: { userEmail: string | undefined }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const stepParam = searchParams.get("step");
  const stepIndex = Math.min(
    Math.max(0, stepParam ? parseInt(stepParam, 10) - 1 : 0),
    STEPS.length - 1
  );
  const [step, setStep] = useState(stepIndex);
  const [draft, setDraft] = useState<Draft>(defaultDraft);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setDraft(loadDraft());
  }, []);

  useEffect(() => {
    const s = searchParams.get("step");
    const i = s ? parseInt(s, 10) - 1 : 0;
    if (!Number.isNaN(i) && i >= 0 && i < STEPS.length) setStep(i);
  }, [searchParams]);

  const updateDraft = useCallback((updates: Partial<Draft>) => {
    const next = { ...loadDraft(), ...updates };
    setDraft(next);
    saveDraft(next);
  }, []);

  const goToStep = useCallback(
    (index: number) => {
      const i = Math.max(0, Math.min(index, STEPS.length - 1));
      setStep(i);
      const params = new URLSearchParams(searchParams.toString());
      params.set("step", String(i + 1));
      router.replace(`/employer/onboarding/start?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  const handleSubmit = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/employer/onboarding/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgName: draft.orgName,
          industry: draft.industry,
          orgSize: draft.orgSize,
          primaryAdminEmail: draft.primaryAdminEmail || userEmail,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Something went wrong");
        setLoading(false);
        return;
      }
      clearDraft();
      router.push(data.redirect || "/employer/dashboard?welcome=1");
    } catch (e) {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  const industries = getIndustriesForSignup();
  const currentStepName = STEPS[step];
  const isLastStep = step === STEPS.length - 1;

  return (
    <div className="mx-auto max-w-lg rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-[#0F172A] dark:text-white">
          Employer onboarding
        </h1>
        <span className="text-sm text-[#64748B] dark:text-gray-400">
          Step {step + 1} of {STEPS.length}
        </span>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </div>
      )}

      {currentStepName === "org_name" && (
        <div className="space-y-4">
          <label className="block text-sm font-medium text-[#334155] dark:text-gray-300">
            Organization name
          </label>
          <input
            type="text"
            value={draft.orgName}
            onChange={(e) => updateDraft({ orgName: e.target.value })}
            placeholder="e.g. Acme Corp"
            className="w-full rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-[#0F172A] focus:border-[#2563EB] focus:outline-none focus:ring-1 focus:ring-[#2563EB] dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            autoFocus
          />
        </div>
      )}

      {currentStepName === "industry" && (
        <div className="space-y-4">
          <label className="block text-sm font-medium text-[#334155] dark:text-gray-300">
            Industry
          </label>
          <select
            value={draft.industry}
            onChange={(e) => updateDraft({ industry: e.target.value })}
            className="w-full rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-[#0F172A] focus:border-[#2563EB] focus:outline-none focus:ring-1 focus:ring-[#2563EB] dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          >
            <option value="">Select industry</option>
            {industries.map((ind) => (
              <option key={ind} value={ind}>
                {ind}
              </option>
            ))}
          </select>
        </div>
      )}

      {currentStepName === "org_size" && (
        <div className="space-y-4">
          <label className="block text-sm font-medium text-[#334155] dark:text-gray-300">
            Organization size
          </label>
          <select
            value={draft.orgSize}
            onChange={(e) => updateDraft({ orgSize: e.target.value })}
            className="w-full rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-[#0F172A] focus:border-[#2563EB] focus:outline-none focus:ring-1 focus:ring-[#2563EB] dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          >
            <option value="">Select size</option>
            {ORG_SIZES.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      )}

      {currentStepName === "admin_email" && (
        <div className="space-y-4">
          <label className="block text-sm font-medium text-[#334155] dark:text-gray-300">
            Primary admin email
          </label>
          <input
            type="email"
            value={draft.primaryAdminEmail || userEmail || ""}
            onChange={(e) => updateDraft({ primaryAdminEmail: e.target.value })}
            placeholder={userEmail || "you@company.com"}
            className="w-full rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-[#0F172A] focus:border-[#2563EB] focus:outline-none focus:ring-1 focus:ring-[#2563EB] dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            autoFocus
          />
          <p className="text-xs text-[#64748B] dark:text-gray-400">
            This must match your logged-in account. You will be the organization admin.
          </p>
        </div>
      )}

      {currentStepName === "confirm" && (
        <div className="space-y-4">
          <p className="text-sm text-[#334155] dark:text-gray-300">
            Review and create your organization.
          </p>
          <dl className="rounded-lg border border-[#E2E8F0] bg-slate-50 p-4 dark:border-gray-600 dark:bg-gray-700/50">
            <div className="flex justify-between py-1">
              <dt className="text-sm text-[#64748B] dark:text-gray-400">Organization</dt>
              <dd className="text-sm font-medium text-[#0F172A] dark:text-white">{draft.orgName || "—"}</dd>
            </div>
            <div className="flex justify-between py-1">
              <dt className="text-sm text-[#64748B] dark:text-gray-400">Industry</dt>
              <dd className="text-sm font-medium text-[#0F172A] dark:text-white">{draft.industry || "—"}</dd>
            </div>
            <div className="flex justify-between py-1">
              <dt className="text-sm text-[#64748B] dark:text-gray-400">Size</dt>
              <dd className="text-sm font-medium text-[#0F172A] dark:text-white">
                {ORG_SIZES.find((s) => s.value === draft.orgSize)?.label ?? draft.orgSize ?? "—"}
              </dd>
            </div>
            <div className="flex justify-between py-1">
              <dt className="text-sm text-[#64748B] dark:text-gray-400">Admin email</dt>
              <dd className="text-sm font-medium text-[#0F172A] dark:text-white">
                {draft.primaryAdminEmail || userEmail || "—"}
              </dd>
            </div>
          </dl>
        </div>
      )}

      <div className="mt-8 flex justify-between">
        <Button
          type="button"
          variant="secondary"
          onClick={() => goToStep(step - 1)}
          disabled={step === 0}
        >
          Back
        </Button>
        {!isLastStep ? (
          <Button
            type="button"
            onClick={() => goToStep(step + 1)}
            disabled={
              (currentStepName === "org_name" && draft.orgName.length < 2) ||
              (currentStepName === "industry" && !draft.industry) ||
              (currentStepName === "org_size" && !draft.orgSize) ||
              (currentStepName === "admin_email" && !(draft.primaryAdminEmail || userEmail))
            }
          >
            Next
          </Button>
        ) : (
          <Button type="button" onClick={handleSubmit} disabled={loading}>
            {loading ? "Creating…" : "Create org & continue"}
          </Button>
        )}
      </div>
    </div>
  );
}
