"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { vouchTierDisplayName } from "@/lib/onboarding/vouchOnboarding";
import {
  VerticalOnboardingFields,
  type VerticalFieldValues,
} from "@/components/verticals/VerticalOnboardingFields";
import {
  getVerticalOnboardingConfig,
  verticalOnboarding,
} from "@/lib/verticals/onboarding";
import { ONBOARDING_INDUSTRY_DRAFT_KEY } from "@/lib/onboarding/onboardingProfileFields";

type ServerState = {
  step: number;
  hasJob: boolean;
  job: { id: string; company_name: string; job_title: string | null } | null;
  contacts: Array<{
    position: number;
    display_name: string;
    email: string | null;
    phone: string | null;
    inviteSent: boolean;
  }>;
  invitesSentCount: number;
  vouchCount: number;
  vouchTier: number;
  vouchStatus?: string;
  completed: boolean;
  canComplete: boolean;
  sendStepDone: boolean;
  industry: string | null;
  professionalSummary: string;
  verticalMetadata: Record<string, unknown>;
  profileBasicsComplete: boolean;
  guidedComplete: boolean;
  jobsCount: number;
  matchesCount: number;
  referenceCount: number;
};

const TOTAL = 9;
const INDUSTRY_OPTIONS = Object.keys(verticalOnboarding);

const fieldClass =
  "w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2.5 text-base text-slate-900 dark:text-slate-100 placeholder:text-slate-400";

function Progress({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-1.5 mb-4" aria-label={`Step ${current} of ${TOTAL}`}>
      {Array.from({ length: TOTAL }, (_, i) => (
        <div
          key={i}
          className={`h-1.5 rounded-full transition-all duration-300 ${
            i + 1 <= current ? "w-4 bg-indigo-600" : "w-1.5 bg-slate-200 dark:bg-slate-700"
          }`}
        />
      ))}
    </div>
  );
}

function resolveInitialStep(data: ServerState): number {
  if (data.completed) {
    if (!data.profileBasicsComplete) return 6;
    const vertical = getVerticalOnboardingConfig(data.industry);
    const meta = data.verticalMetadata ?? {};
    const hasVerticalData =
      !vertical ||
      vertical.employeeFields.some((f) => {
        const v = meta[f.key];
        return v != null && v !== "" && !(Array.isArray(v) && v.length === 0);
      });
    if (vertical && !hasVerticalData) return 7;
    return 9;
  }
  if (!data.industry?.trim()) return data.step <= 1 ? 1 : 2;
  if (data.step === 2) return 3;
  if (data.step === 3) return 4;
  if (data.step === 4) return 5;
  if (data.step >= 5) return 5;
  return 1;
}

export function VouchOnboardingWizard({ firstName }: { firstName: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [server, setServer] = useState<ServerState | null>(null);
  const [step, setStep] = useState(1);
  const [celebrationNote, setCelebrationNote] = useState<string | null>(null);

  const [industry, setIndustry] = useState("");
  const [professionalRole, setProfessionalRole] = useState("");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [bio, setBio] = useState("");
  const [verticalValues, setVerticalValues] = useState<VerticalFieldValues>({});

  const [c1Name, setC1Name] = useState("");
  const [c1Email, setC1Email] = useState("");
  const [c1Phone, setC1Phone] = useState("");
  const [c2Name, setC2Name] = useState("");
  const [c2Email, setC2Email] = useState("");
  const [c2Phone, setC2Phone] = useState("");
  const [inviteMessage, setInviteMessage] = useState<string | null>(null);
  const [inviteUrls, setInviteUrls] = useState<
    { email: string; confirmUrl: string; signupUrl: string; url?: string }[]
  >([]);
  const [showSecondCoworker, setShowSecondCoworker] = useState(false);

  const verticalConfig = useMemo(() => getVerticalOnboardingConfig(industry), [industry]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/onboarding/vouch/state", { credentials: "include" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data?.error === "string" ? data.error : "Could not load onboarding");
        return;
      }
      const s = data as ServerState;
      setServer(s);
      let nextStep = resolveInitialStep(s);
      try {
        const draft = localStorage.getItem(ONBOARDING_INDUSTRY_DRAFT_KEY);
        if (draft?.trim()) {
          setIndustry(draft.trim());
          if (nextStep === 2) nextStep = 3;
        } else if (s.industry) {
          setIndustry(s.industry);
        }
      } catch {
        if (s.industry) setIndustry(s.industry);
      }
      setStep(nextStep);
      if (s.professionalSummary) setBio(s.professionalSummary);
      if (s.verticalMetadata && typeof s.verticalMetadata === "object") {
        setVerticalValues(s.verticalMetadata as VerticalFieldValues);
      }
      if (s.job) {
        setCompany(s.job.company_name ?? "");
        setRole(s.job.job_title ?? "");
        setProfessionalRole(s.job.job_title ?? "");
      }
      const contacts = s.contacts ?? [];
      const a = contacts.find((c) => c.position === 1);
      const b = contacts.find((c) => c.position === 2);
      if (a) {
        setC1Name(a.display_name);
        setC1Email(a.email ?? "");
        setC1Phone(a.phone ?? "");
      }
      if (b) {
        setC2Name(b.display_name);
        setC2Email(b.email ?? "");
        setC2Phone(b.phone ?? "");
        setShowSecondCoworker(true);
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const key = searchParams.get("celebrate")?.trim();
    if (!key) return;
    const copy: Record<string, string> = {
      job: "Nice — your job is saved. Keep building your reputation.",
      matches: "Great — you're connecting with coworkers.",
      review: "Awesome — reviews make your trust score meaningful.",
    };
    setCelebrationNote(copy[key] ?? "Great progress — keep going.");
    const t = setTimeout(() => setCelebrationNote(null), 6000);
    return () => clearTimeout(t);
  }, [searchParams]);

  async function saveProfileFields(payload: {
    industry?: string;
    professional_summary?: string;
    vertical_metadata?: Record<string, unknown>;
  }) {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/onboarding/profile", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data?.error === "string" ? data.error : "Could not save profile");
        return false;
      }
      if (payload.industry?.trim()) {
        try {
          localStorage.setItem(ONBOARDING_INDUSTRY_DRAFT_KEY, payload.industry.trim());
        } catch {
          /* ignore storage errors */
        }
      }
      await load();
      return true;
    } finally {
      setSaving(false);
    }
  }

  async function saveRoleStep() {
    if (!industry.trim() || !professionalRole.trim()) {
      setError("Choose your industry and professional role.");
      return;
    }
    const ok = await saveProfileFields({ industry: industry.trim() });
    if (ok) {
      setRole(professionalRole.trim());
      setStep(3);
    }
  }

  async function saveJob() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/onboarding/vouch/job", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company_name: company.trim(), role: role.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data?.error === "string" ? data.error : "Could not save job");
        return;
      }
      setStep(4);
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function saveContacts() {
    if (!c1Name.trim() || !(c1Email.trim() || c1Phone.trim())) {
      setError("Add coworker 1 with name and email or phone");
      return;
    }
    const contacts: Array<{ position: number; display_name: string; email?: string; phone?: string }> = [
      {
        position: 1,
        display_name: c1Name.trim(),
        email: c1Email.trim() || undefined,
        phone: c1Phone.trim() || undefined,
      },
    ];
    if (showSecondCoworker && c2Name.trim() && (c2Email.trim() || c2Phone.trim())) {
      contacts.push({
        position: 2,
        display_name: c2Name.trim(),
        email: c2Email.trim() || undefined,
        phone: c2Phone.trim() || undefined,
      });
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/onboarding/vouch/contacts", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contacts }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data?.error === "string" ? data.error : "Could not save coworkers");
        return;
      }
      await load();
      const hasEmail = contacts.some((c) => (c.email ?? "").length > 0);
      setStep(hasEmail ? 5 : 6);
    } finally {
      setSaving(false);
    }
  }

  async function sendInvites() {
    setSaving(true);
    setError(null);
    setInviteMessage(null);
    setInviteUrls([]);
    try {
      const res = await fetch("/api/onboarding/vouch/sendinvite", { method: "POST", credentials: "include" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data?.error === "string" ? data.error : "Could not send invites");
        return;
      }
      setInviteMessage(typeof data?.message === "string" ? data.message : null);
      if (Array.isArray(data?.inviteUrls)) {
        setInviteUrls(data.inviteUrls);
      }
      await load();
      setStep(6);
    } finally {
      setSaving(false);
    }
  }

  async function markVouchLoopComplete() {
    if (!server?.canComplete && !server?.completed) return true;
    if (server?.completed) return true;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/onboarding/vouch/done", { method: "POST", credentials: "include" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data?.error === "string" ? data.error : "Could not complete onboarding");
        return false;
      }
      await load();
      return true;
    } finally {
      setSaving(false);
    }
  }

  async function finish() {
    const ok = await markVouchLoopComplete();
    if (!ok) return;
    router.push("/dashboard");
    router.refresh();
  }

  if (loading && !server) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-slate-500 text-sm px-4">
        Loading your onboarding…
      </div>
    );
  }

  const tierLabel = server ? vouchTierDisplayName(server.vouchTier) : "No vouch";

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="max-w-md mx-auto px-6 py-6 pb-24 sm:py-10">
        <p className="mb-2 text-sm text-slate-500 dark:text-slate-400">
          Step {step}/{TOTAL}
        </p>
        <Progress current={step} />

        {celebrationNote && (
          <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-900 dark:text-emerald-100">
            {celebrationNote}
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 text-red-800 text-sm px-3 py-2 dark:bg-red-950/40 dark:border-red-900 dark:text-red-200">
            {error}
          </div>
        )}

        {step === 1 && (
          <section className="space-y-6">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white leading-tight">
              Welcome to WorkVouch, {firstName}
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-base leading-relaxed">
              We&apos;ll help you build a verified professional reputation — real coworkers confirming real work.
            </p>
            <button
              type="button"
              onClick={() => setStep(2)}
              className="w-full rounded-2xl bg-indigo-600 text-white font-semibold py-3.5 text-base shadow-lg shadow-indigo-600/20"
            >
              Get started
            </button>
          </section>
        )}

        {step === 2 && (
          <section className="space-y-5">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">Your professional role</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              This helps us tailor optional industry questions and match you with the right coworkers.
            </p>
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Industry</span>
              <select className={`mt-1 ${fieldClass}`} value={industry} onChange={(e) => setIndustry(e.target.value)}>
                <option value="">Select industry</option>
                {INDUSTRY_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Professional role</span>
              <input
                className={`mt-1 ${fieldClass}`}
                value={professionalRole}
                onChange={(e) => setProfessionalRole(e.target.value)}
                placeholder="e.g. Registered Nurse, Forklift Operator"
              />
            </label>
            <div className="flex gap-3">
              <button type="button" onClick={() => setStep(1)} className="flex-1 rounded-2xl border py-3 font-medium">
                Back
              </button>
              <button
                type="button"
                disabled={saving || !industry.trim() || !professionalRole.trim()}
                onClick={saveRoleStep}
                className="flex-[2] rounded-2xl bg-indigo-600 text-white font-semibold py-3 disabled:opacity-50"
              >
                {saving ? "Saving…" : "Continue"}
              </button>
            </div>
          </section>
        )}

        {step === 3 && (
          <section className="space-y-5">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">Add employment history</h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm">Where did you work most recently?</p>
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Company</span>
              <input className={`mt-1 ${fieldClass}`} value={company} onChange={(e) => setCompany(e.target.value)} />
            </label>
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Role at company</span>
              <input className={`mt-1 ${fieldClass}`} value={role} onChange={(e) => setRole(e.target.value)} />
            </label>
            <div className="flex gap-3">
              <button type="button" onClick={() => setStep(2)} className="flex-1 rounded-2xl border py-3 font-medium">
                Back
              </button>
              <button
                type="button"
                disabled={saving || !company.trim() || !role.trim()}
                onClick={saveJob}
                className="flex-[2] rounded-2xl bg-indigo-600 text-white font-semibold py-3 disabled:opacity-50"
              >
                {saving ? "Saving…" : "Continue"}
              </button>
            </div>
          </section>
        )}

        {step === 4 && (
          <section className="space-y-5">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">Find coworkers</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Add people who can vouch for your work. At least one coworker is required.
            </p>
            <div className="rounded-2xl border p-4 space-y-3 bg-white dark:bg-slate-900/50">
              <p className="text-xs font-bold text-slate-500 uppercase">Coworker 1</p>
              <input className={fieldClass} placeholder="Name" value={c1Name} onChange={(e) => setC1Name(e.target.value)} />
              <input className={fieldClass} placeholder="Email" type="email" value={c1Email} onChange={(e) => setC1Email(e.target.value)} />
              <input className={fieldClass} placeholder="Phone (optional)" type="tel" value={c1Phone} onChange={(e) => setC1Phone(e.target.value)} />
            </div>
            {!showSecondCoworker ? (
              <button type="button" onClick={() => setShowSecondCoworker(true)} className="text-sm font-medium text-indigo-600">
                + Add another coworker
              </button>
            ) : (
              <div className="rounded-2xl border border-dashed p-4 space-y-3">
                <p className="text-xs font-bold text-slate-500 uppercase">Coworker 2</p>
                <input className={fieldClass} placeholder="Name" value={c2Name} onChange={(e) => setC2Name(e.target.value)} />
                <input className={fieldClass} placeholder="Email" type="email" value={c2Email} onChange={(e) => setC2Email(e.target.value)} />
              </div>
            )}
            <div className="flex gap-3">
              <button type="button" onClick={() => setStep(3)} className="flex-1 rounded-2xl border py-3 font-medium">
                Back
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={saveContacts}
                className="flex-[2] rounded-2xl bg-indigo-600 text-white font-semibold py-3 disabled:opacity-50"
              >
                {saving ? "Saving…" : "Continue"}
              </button>
            </div>
          </section>
        )}

        {step === 5 && (
          <section className="space-y-5">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">Request your first verification</h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              Send a vouch request to coworkers with email addresses.
            </p>
            {inviteMessage && (
              <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 px-3 py-3 text-sm text-emerald-900">
                {inviteMessage}
              </div>
            )}
            <div className="flex flex-col gap-3">
              <button
                type="button"
                disabled={saving}
                onClick={sendInvites}
                className="w-full rounded-2xl bg-indigo-600 text-white font-semibold py-3.5 disabled:opacity-50"
              >
                {saving ? "Working…" : inviteUrls.length ? "Resend invites" : "Send invite"}
              </button>
              <button type="button" onClick={() => setStep(4)} className="w-full rounded-2xl border py-3 font-medium">
                Back
              </button>
              <button type="button" onClick={() => setStep(6)} className="text-sm text-indigo-600 font-medium">
                Skip to profile setup
              </button>
            </div>
          </section>
        )}

        {step === 6 && (
          <section className="space-y-5">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">Complete your profile</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              A short professional summary helps employers understand your experience.
            </p>
            <textarea
              className={`${fieldClass} min-h-[120px]`}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Describe your experience and strengths (at least a few sentences)."
            />
            <div className="flex gap-3">
              <button type="button" onClick={() => setStep(5)} className="flex-1 rounded-2xl border py-3 font-medium">
                Back
              </button>
              <button
                type="button"
                disabled={saving || bio.trim().length < 20}
                onClick={async () => {
                  const ok = await saveProfileFields({ professional_summary: bio.trim() });
                  if (ok) setStep(verticalConfig ? 7 : 8);
                }}
                className="flex-[2] rounded-2xl bg-indigo-600 text-white font-semibold py-3 disabled:opacity-50"
              >
                {saving ? "Saving…" : "Continue"}
              </button>
            </div>
          </section>
        )}

        {step === 7 && verticalConfig && (
          <section className="space-y-5">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">Industry details</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">Optional questions for {verticalConfig.industry}.</p>
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-900/90 p-4">
              <VerticalOnboardingFields industry={industry} value={verticalValues} onChange={setVerticalValues} />
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setStep(6)} className="flex-1 rounded-2xl border py-3 font-medium">
                Back
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={async () => {
                  const ok = await saveProfileFields({ vertical_metadata: verticalValues });
                  if (ok) setStep(8);
                }}
                className="flex-[2] rounded-2xl bg-indigo-600 text-white font-semibold py-3 disabled:opacity-50"
              >
                {saving ? "Saving…" : "Continue"}
              </button>
            </div>
          </section>
        )}

        {step === 8 && (
          <section className="space-y-5">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">Review</h1>
            <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-2 rounded-2xl border p-4 bg-white dark:bg-slate-900/50">
              <li>Industry: {industry || "—"}</li>
              <li>Role: {professionalRole || role || "—"}</li>
              <li>Company: {company || server?.job?.company_name || "—"}</li>
              <li>Coworkers added: {server?.contacts?.length ?? 0}</li>
              <li>Trust tier: {tierLabel}</li>
            </ul>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(verticalConfig ? 7 : 6)}
                className="flex-1 rounded-2xl border py-3 font-medium"
              >
                Back
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={async () => {
                  const ok = await markVouchLoopComplete();
                  if (ok) setStep(9);
                }}
                className="flex-[2] rounded-2xl bg-indigo-600 text-white font-semibold py-3 disabled:opacity-50"
              >
                {saving ? "Saving…" : "Finish setup"}
              </button>
            </div>
          </section>
        )}

        {step === 9 && (
          <section className="space-y-6 text-center">
            <div className="text-4xl" aria-hidden>
              🎉
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Welcome to WorkVouch</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Your professional reputation has officially begun. Every coworker verification you receive strengthens your
              profile.
            </p>
            <button
              type="button"
              disabled={saving}
              onClick={finish}
              className="w-full rounded-2xl bg-indigo-600 text-white font-semibold py-3.5 disabled:opacity-50"
            >
              {saving ? "Finishing…" : "Go to dashboard"}
            </button>
          </section>
        )}
      </div>
    </div>
  );
}
