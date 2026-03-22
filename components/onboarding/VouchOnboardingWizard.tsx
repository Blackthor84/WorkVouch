"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { vouchTierDisplayName } from "@/lib/onboarding/vouchOnboarding";

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
  /** From `profiles.vouch_status` or derived via getStatus(count). */
  vouchStatus?: string;
  completed: boolean;
  canComplete: boolean;
  sendStepDone: boolean;
};

const TOTAL = 5;

const fieldClass =
  "w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2.5 text-base text-slate-900 dark:text-slate-100 placeholder:text-slate-400";

function Progress({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-1.5 mb-4" aria-label={`Step ${current} of ${TOTAL}`}>
      {Array.from({ length: TOTAL }, (_, i) => (
        <div
          key={i}
          className={`h-1.5 rounded-full transition-all duration-300 ${
            i + 1 <= current ? "w-8 bg-indigo-600" : "w-2 bg-slate-200 dark:bg-slate-700"
          }`}
        />
      ))}
    </div>
  );
}

export function VouchOnboardingWizard({ firstName }: { firstName: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [server, setServer] = useState<ServerState | null>(null);
  const [step, setStep] = useState(1);

  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
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
      setServer(data as ServerState);
      const s = Math.min(TOTAL, Math.max(1, Number(data.step) || 1));
      setStep(s);
      if (data.job) {
        setCompany(data.job.company_name ?? "");
        setRole(data.job.job_title ?? "");
      }
      const contacts = (data.contacts ?? []) as ServerState["contacts"];
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
      setStep(3);
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
    if (showSecondCoworker) {
      const c2Any = c2Name.trim() || c2Email.trim() || c2Phone.trim();
      if (c2Any && (!c2Name.trim() || !(c2Email.trim() || c2Phone.trim()))) {
        setError("Complete coworker 2 (name + email or phone), or tap Remove.");
        return;
      }
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
      setStep(hasEmail ? 4 : 5);
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
      const res = await fetch("/api/onboarding/vouch/sendinvite", {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data?.error === "string" ? data.error : "Could not send invites");
        return;
      }
      setInviteMessage(typeof data?.message === "string" ? data.message : null);
      if (Array.isArray(data?.inviteUrls)) {
        setInviteUrls(
          data.inviteUrls as { email: string; confirmUrl: string; signupUrl: string; url?: string }[]
        );
      }
      setStep(5);
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function finish() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/onboarding/vouch/done", {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data?.error === "string" ? data.error : "Could not finish");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  if (loading && !server) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-slate-500 text-sm px-4">Loading…</div>
    );
  }

  const tierLabel = server ? vouchTierDisplayName(server.vouchTier) : "No vouch";

  return (
    <div className="max-w-md mx-auto px-6 py-6 pb-24 sm:py-10">
      <p className="mb-2 text-sm text-slate-500 dark:text-slate-400">
        Step {step}/{TOTAL}
      </p>
      <Progress current={step} />

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 text-red-800 text-sm px-3 py-2 dark:bg-red-950/40 dark:border-red-900 dark:text-red-200">
          {error}
        </div>
      )}

      {step === 1 && (
        <section className="space-y-6">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white leading-tight">
            Who have you worked with that would vouch for you?
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-base leading-relaxed">
            Real coworkers confirming real work is how your profile earns trust. Next: a quick job, then people who
            know your work.
          </p>
          <button
            type="button"
            onClick={() => setStep(2)}
            className="w-full rounded-2xl bg-indigo-600 text-white font-semibold py-3.5 text-base shadow-lg shadow-indigo-600/20 active:scale-[0.99] transition-transform"
          >
            Start
          </button>
          <p className="text-xs text-center text-slate-500">Hi {firstName}</p>
        </section>
      )}

      {step === 2 && (
        <section className="space-y-5">
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">Add your job</h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm">Company and role only — you can add details later.</p>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Company</span>
            <input
              className={`mt-1 ${fieldClass} px-4 py-3`}
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Company"
              autoComplete="organization"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Your role</span>
            <input
              className={`mt-1 ${fieldClass} px-4 py-3`}
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="Role"
              autoComplete="organization-title"
            />
          </label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex-1 rounded-2xl border border-slate-200 dark:border-slate-600 py-3 font-medium text-slate-700 dark:text-slate-200"
            >
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

      {step === 3 && (
        <section className="space-y-5">
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">Add 2 coworkers</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            People with 2+ confirmations get way more trust. Add at least one — add a second if you can.
          </p>
          <p className="text-slate-600 dark:text-slate-400 text-sm">
            Name plus <span className="font-medium">email</span> (for the invite) and/or <span className="font-medium">phone</span>.
          </p>
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 p-4 space-y-3 bg-white dark:bg-slate-900/50">
            <p className="text-xs font-bold text-slate-500 uppercase">Coworker 1</p>
            <input
              className={fieldClass}
              placeholder="Name"
              value={c1Name}
              onChange={(e) => setC1Name(e.target.value)}
            />
            <input
              className={fieldClass}
              placeholder="Email"
              type="email"
              value={c1Email}
              onChange={(e) => setC1Email(e.target.value)}
            />
            <input
              className={fieldClass}
              placeholder="Phone (optional)"
              type="tel"
              value={c1Phone}
              onChange={(e) => setC1Phone(e.target.value)}
            />
          </div>
          {!showSecondCoworker ? (
            <button
              type="button"
              onClick={() => setShowSecondCoworker(true)}
              className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              + Add another coworker
            </button>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-600 p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-bold text-slate-500 uppercase">Coworker 2</p>
                <button
                  type="button"
                  className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  onClick={() => {
                    setShowSecondCoworker(false);
                    setC2Name("");
                    setC2Email("");
                    setC2Phone("");
                  }}
                >
                  Remove
                </button>
              </div>
              <input
                className={fieldClass}
                placeholder="Name"
                value={c2Name}
                onChange={(e) => setC2Name(e.target.value)}
              />
              <input
                className={fieldClass}
                placeholder="Email"
                type="email"
                value={c2Email}
                onChange={(e) => setC2Email(e.target.value)}
              />
              <input
                className={fieldClass}
                placeholder="Phone (optional)"
                type="tel"
                value={c2Phone}
                onChange={(e) => setC2Phone(e.target.value)}
              />
            </div>
          )}
          <div className="flex gap-3">
            <button type="button" onClick={() => setStep(2)} className="flex-1 rounded-2xl border py-3 font-medium">
              Back
            </button>
            <button
              type="button"
              disabled={saving || !c1Name.trim() || !(c1Email.trim() || c1Phone.trim())}
              onClick={saveContacts}
              className="flex-[2] rounded-2xl bg-indigo-600 text-white font-semibold py-3 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Continue"}
            </button>
          </div>
        </section>
      )}

      {step === 4 && (
        <section className="space-y-5">
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">Send your first vouch request</h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm">
            We email each coworker a link to confirm (no signup required). You can copy the link below if you want to
            resend it yourself.
          </p>
          {inviteMessage && (
            <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 px-3 py-3 text-sm text-emerald-900 dark:text-emerald-100">
              {inviteMessage}
            </div>
          )}
          {inviteUrls.length > 0 && (
            <ul className="space-y-2 text-sm">
              {inviteUrls.map((u) => (
                <li key={u.email} className="break-all rounded-lg bg-slate-100 dark:bg-slate-800 p-2">
                  <span className="font-medium text-slate-700 dark:text-slate-300">{u.email}</span>
                  <div className="text-xs text-slate-500 mt-1">
                    <span className="font-medium text-slate-600 dark:text-slate-400">Confirm (no account):</span>{" "}
                    {u.confirmUrl ?? u.url}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    <span className="font-medium text-slate-600 dark:text-slate-400">Signup with invite:</span>{" "}
                    {u.signupUrl ?? u.url}
                  </div>
                </li>
              ))}
            </ul>
          )}
          <div className="flex flex-col gap-3">
            <button
              type="button"
              disabled={saving}
              onClick={sendInvites}
              className="w-full rounded-2xl bg-indigo-600 text-white font-semibold py-3.5 disabled:opacity-50"
            >
              {saving ? "Working…" : inviteUrls.length ? "Resend / refresh links" : "Send invite"}
            </button>
            <button type="button" onClick={() => setStep(3)} className="w-full rounded-2xl border py-3 font-medium">
              Back
            </button>
            <button type="button" onClick={() => setStep(5)} className="text-sm text-indigo-600 font-medium">
              Skip to confirmation
            </button>
          </div>
        </section>
      )}

      {step === 5 && (
        <section className="space-y-6 text-center">
          <div className="text-4xl" aria-hidden>
            🎉
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            You&apos;re 1 step away from being verified
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Once your coworker confirms, your profile becomes verified. We&apos;ll notify you when someone vouches for
            you.
          </p>
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 px-4 py-3 text-left text-sm">
            <p className="font-semibold text-slate-800 dark:text-slate-200">Your status</p>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Tier: <span className="font-medium text-slate-900 dark:text-white">{tierLabel}</span>
              {server != null && server.vouchCount > 0 ? ` · ${server.vouchCount} vouch(es)` : ""}
            </p>
            <p className="text-xs text-slate-500 mt-2">
              0 = No vouch · 1 = Starter · 2–4 = Verified · 5+ = Trusted
            </p>
          </div>
          <button
            type="button"
            disabled={saving || !(server?.canComplete)}
            onClick={finish}
            className="w-full rounded-2xl bg-indigo-600 text-white font-semibold py-3.5 disabled:opacity-50"
          >
            {saving ? "Finishing…" : "Continue to dashboard"}
          </button>
          {!server?.canComplete && (
            <p className="text-xs text-amber-700 dark:text-amber-400">
              Add a job and at least one coworker (or send an invite) to continue.
            </p>
          )}
          <button type="button" onClick={() => setStep(4)} className="text-sm text-slate-500 underline">
            Back
          </button>
        </section>
      )}
    </div>
  );
}
