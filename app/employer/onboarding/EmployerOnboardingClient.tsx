"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { WvCard, WvButton, WvInput } from "@/components/wv";
import { getIndustriesForSignup } from "@/lib/constants/industries";
import {
  VerticalOnboardingFields,
  type VerticalFieldValues,
} from "@/components/verticals/VerticalOnboardingFields";
import { getVerticalOnboardingConfig } from "@/lib/verticals/onboarding";

const STORAGE_KEY = "employer_onboarding_draft";

const ALL_STEPS = [
  "welcome",
  "org_name",
  "company_details",
  "industry",
  "industry_fields",
  "hiring_preferences",
  "invite_team",
  "billing",
  "review",
] as const;

type StepId = (typeof ALL_STEPS)[number];

const STEP_LABELS: Record<StepId, string> = {
  welcome: "Welcome",
  org_name: "Create organization",
  company_details: "Company details",
  industry: "Industry",
  industry_fields: "Industry details",
  hiring_preferences: "Hiring preferences",
  invite_team: "Invite team",
  billing: "Plan",
  review: "Review",
};

const ORG_SIZES = [
  { value: "1", label: "Just me" },
  { value: "2-10", label: "2–10 employees" },
  { value: "11-50", label: "11–50 employees" },
  { value: "51+", label: "51+ employees" },
] as const;

const selectClass =
  "w-full rounded-xl border border-wv-border bg-wv-surface px-4 py-3 text-sm text-wv-foreground focus:border-wv-brand-blue/50 focus:outline-none focus:ring-2 focus:ring-wv-brand-blue/30";

type Draft = {
  orgName: string;
  industry: string;
  orgSize: string;
  primaryAdminEmail: string;
  verticalValues: VerticalFieldValues;
  teamInviteEmail: string;
};

const defaultDraft: Draft = {
  orgName: "",
  industry: "",
  orgSize: "",
  primaryAdminEmail: "",
  verticalValues: {},
  teamInviteEmail: "",
};

function loadDraft(): Draft {
  if (typeof window === "undefined") return defaultDraft;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Draft>;
      return {
        ...defaultDraft,
        ...parsed,
        verticalValues: parsed.verticalValues ?? {},
      };
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

function ProgressBar({ current, total }: { current: number; total: number }) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between text-xs text-wv-muted mb-2">
        <span>
          Step {current} of {total}
        </span>
        <span>{Math.round((current / total) * 100)}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-wv-border overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-violet-500 to-blue-500 transition-all duration-300"
          style={{ width: `${(current / total) * 100}%` }}
        />
      </div>
    </div>
  );
}

function verticalFieldsValid(industry: string, values: VerticalFieldValues): boolean {
  const config = getVerticalOnboardingConfig(industry);
  const fields = config?.employerFields ?? [];
  return fields.every((f) => {
    if (!f.required) return true;
    const v = values[f.key];
    if (v == null || v === "") return false;
    if (Array.isArray(v) && v.length === 0) return false;
    return true;
  });
}

export function EmployerOnboardingClient({ userEmail }: { userEmail: string | undefined }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [draft, setDraft] = useState<Draft>(defaultDraft);
  const [stepIndex, setStepIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [celebration, setCelebration] = useState(false);

  const activeSteps = useMemo(() => {
    const config = getVerticalOnboardingConfig(draft.industry);
    const hasEmployerFields = (config?.employerFields?.length ?? 0) > 0;
    return ALL_STEPS.filter((s) => s !== "industry_fields" || hasEmployerFields);
  }, [draft.industry]);

  const currentStep = activeSteps[stepIndex] ?? "welcome";
  const isLastStep = stepIndex === activeSteps.length - 1;

  useEffect(() => {
    setDraft(loadDraft());
  }, []);

  useEffect(() => {
    const s = searchParams.get("step");
    const i = s ? parseInt(s, 10) - 1 : 0;
    if (!Number.isNaN(i) && i >= 0) {
      setStepIndex(Math.min(i, activeSteps.length - 1));
    }
  }, [searchParams, activeSteps.length]);

  const updateDraft = useCallback((updates: Partial<Draft>) => {
    const next = { ...loadDraft(), ...updates };
    setDraft(next);
    saveDraft(next);
  }, []);

  const goToStep = useCallback(
    (index: number) => {
      const i = Math.max(0, Math.min(index, activeSteps.length - 1));
      setStepIndex(i);
      const params = new URLSearchParams(searchParams.toString());
      params.set("step", String(i + 1));
      router.replace(`/employer/onboarding/start?${params.toString()}`, { scroll: false });
    },
    [router, searchParams, activeSteps.length],
  );

  const canContinue = useMemo(() => {
    switch (currentStep) {
      case "welcome":
        return true;
      case "org_name":
        return draft.orgName.trim().length >= 2;
      case "company_details":
        return Boolean((draft.primaryAdminEmail || userEmail)?.trim());
      case "industry":
        return Boolean(draft.industry);
      case "industry_fields":
        return verticalFieldsValid(draft.industry, draft.verticalValues);
      case "hiring_preferences":
        return Boolean(draft.orgSize);
      case "invite_team":
      case "billing":
        return true;
      case "review":
        return true;
      default:
        return false;
    }
  }, [currentStep, draft, userEmail]);

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
          verticalMetadata: draft.verticalValues,
          teamInviteEmail: draft.teamInviteEmail.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Something went wrong");
        setLoading(false);
        return;
      }
      clearDraft();
      setCelebration(true);
      setLoading(false);
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  const industries = getIndustriesForSignup();

  if (celebration) {
    return (
      <WvCard className="mx-auto max-w-lg text-center" padding="lg" glow>
        <h1 className="text-2xl font-semibold text-wv-foreground">Your organization is ready</h1>
        <p className="mt-3 text-sm text-wv-muted leading-relaxed">
          You can now verify candidates, collaborate with your hiring team, and begin building
          trusted hiring workflows.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <WvButton href="/employer/dashboard?welcome=1" size="lg">
            Go to Employer Dashboard
          </WvButton>
          <WvButton href="/employer/employees" variant="secondary" size="lg">
            Invite team
          </WvButton>
        </div>
      </WvCard>
    );
  }

  return (
    <WvCard className="mx-auto max-w-lg" padding="lg">
      <ProgressBar current={stepIndex + 1} total={activeSteps.length} />

      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-wv-subtle">
          Employer onboarding
        </p>
        <h1 className="mt-1 text-xl font-semibold text-wv-foreground">
          {STEP_LABELS[currentStep]}
        </h1>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {currentStep === "welcome" && (
        <div className="space-y-3 text-sm text-wv-muted">
          <p>
            Set up your organization in a few steps. We&apos;ll save your progress automatically so
            you can refresh without losing work.
          </p>
          <p>This takes about 3 minutes and unlocks your employer dashboard.</p>
        </div>
      )}

      {currentStep === "org_name" && (
        <WvInput
          label="Organization name"
          type="text"
          value={draft.orgName}
          onChange={(e) => updateDraft({ orgName: e.target.value })}
          placeholder="e.g. Acme Corp"
          autoFocus
        />
      )}

      {currentStep === "company_details" && (
        <div className="space-y-2">
          <WvInput
            label="Primary admin email"
            type="email"
            value={draft.primaryAdminEmail || userEmail || ""}
            onChange={(e) => updateDraft({ primaryAdminEmail: e.target.value })}
            placeholder={userEmail || "you@company.com"}
            autoFocus
          />
          <p className="text-xs text-wv-muted">
            This must match your logged-in account. You will be the organization admin.
          </p>
        </div>
      )}

      {currentStep === "industry" && (
        <div className="w-full">
          <label htmlFor="industry" className="mb-1.5 block text-sm font-medium text-wv-muted">
            Industry
          </label>
          <select
            id="industry"
            value={draft.industry}
            onChange={(e) =>
              updateDraft({ industry: e.target.value, verticalValues: {} })
            }
            className={selectClass}
          >
            <option value="">Select industry</option>
            {industries.map((ind) => (
              <option key={ind} value={ind}>
                {ind}
              </option>
            ))}
          </select>
          <p className="mt-2 text-xs text-wv-muted">
            Industry-specific hiring questions appear on the next step when applicable.
          </p>
        </div>
      )}

      {currentStep === "industry_fields" && (
        <VerticalOnboardingFields
          industry={draft.industry}
          value={draft.verticalValues}
          onChange={(values) => updateDraft({ verticalValues: values })}
          mode="employer"
        />
      )}

      {currentStep === "hiring_preferences" && (
        <div className="space-y-4">
          <div className="w-full">
            <label htmlFor="org-size" className="mb-1.5 block text-sm font-medium text-wv-muted">
              Organization size
            </label>
            <select
              id="org-size"
              value={draft.orgSize}
              onChange={(e) => updateDraft({ orgSize: e.target.value })}
              className={selectClass}
            >
              <option value="">Select size</option>
              {ORG_SIZES.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <p className="text-xs text-wv-muted">
            Helps us tailor verification workflows and team collaboration defaults for your hiring
            volume.
          </p>
        </div>
      )}

      {currentStep === "invite_team" && (
        <div className="space-y-3">
          <WvInput
            label="Teammate email (optional)"
            type="email"
            value={draft.teamInviteEmail}
            onChange={(e) => updateDraft({ teamInviteEmail: e.target.value })}
            placeholder="colleague@company.com"
          />
          <p className="text-xs text-wv-muted">
            Optional — saved for later. Invite teammates from Settings after setup.
          </p>
        </div>
      )}

      {currentStep === "billing" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-wv-border bg-wv-surface/60 p-4">
            <p className="font-medium text-wv-foreground">Free plan</p>
            <p className="mt-1 text-sm text-wv-muted">
              Start verifying candidates at no cost. Upgrade anytime for advanced analytics and
              higher limits.
            </p>
          </div>
          <WvButton href="/employer/upgrade" variant="ghost" size="sm" className="px-0">
            Compare plans →
          </WvButton>
        </div>
      )}

      {currentStep === "review" && (
        <div className="space-y-4">
          <p className="text-sm text-wv-muted">Review and create your organization.</p>
          <dl className="rounded-xl border border-wv-border bg-wv-surface/60 p-4">
            <div className="flex justify-between py-1">
              <dt className="text-sm text-wv-muted">Organization</dt>
              <dd className="text-sm font-medium text-wv-foreground">{draft.orgName || "—"}</dd>
            </div>
            <div className="flex justify-between py-1">
              <dt className="text-sm text-wv-muted">Industry</dt>
              <dd className="text-sm font-medium text-wv-foreground">{draft.industry || "—"}</dd>
            </div>
            <div className="flex justify-between py-1">
              <dt className="text-sm text-wv-muted">Size</dt>
              <dd className="text-sm font-medium text-wv-foreground">
                {ORG_SIZES.find((s) => s.value === draft.orgSize)?.label ?? draft.orgSize ?? "—"}
              </dd>
            </div>
            <div className="flex justify-between py-1">
              <dt className="text-sm text-wv-muted">Admin email</dt>
              <dd className="text-sm font-medium text-wv-foreground">
                {draft.primaryAdminEmail || userEmail || "—"}
              </dd>
            </div>
            {draft.teamInviteEmail && (
              <div className="flex justify-between py-1">
                <dt className="text-sm text-wv-muted">Team invite</dt>
                <dd className="text-sm font-medium text-wv-foreground">{draft.teamInviteEmail}</dd>
              </div>
            )}
          </dl>
        </div>
      )}

      <div className="mt-8 flex justify-between">
        <WvButton
          type="button"
          variant="secondary"
          onClick={() => goToStep(stepIndex - 1)}
          disabled={stepIndex === 0 || loading}
        >
          Back
        </WvButton>
        {!isLastStep ? (
          <WvButton type="button" onClick={() => goToStep(stepIndex + 1)} disabled={!canContinue}>
            Continue
          </WvButton>
        ) : (
          <WvButton type="button" onClick={handleSubmit} disabled={loading || !canContinue}>
            {loading ? "Creating…" : "Create organization"}
          </WvButton>
        )}
      </div>

      {(currentStep === "invite_team" || currentStep === "billing") && !isLastStep && (
        <div className="mt-3 text-center">
          <button
            type="button"
            className="text-xs text-wv-muted hover:text-wv-foreground underline"
            onClick={() => goToStep(stepIndex + 1)}
          >
            Skip for now
          </button>
        </div>
      )}
    </WvCard>
  );
}
