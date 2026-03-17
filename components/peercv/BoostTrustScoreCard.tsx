"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

const JOIN_URL = process.env.NEXT_PUBLIC_APP_URL || "https://app.peercv.com";

export function BoostTrustScoreCard({ className }: { className?: string }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const sendInvite = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      setError("Enter an email address");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/referrals/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error === "Already invited" ? "Already invited" : "Something went wrong");
        return;
      }
      setSent(true);
      setEmail("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={cn(
        "rounded-2xl bg-white p-6 shadow-sm transition hover:shadow-md border border-slate-200/80",
        className
      )}
    >
      <h3 className="text-lg font-semibold text-slate-900">
        Boost your Trust Score
      </h3>
      <p className="mt-2 text-sm text-slate-500">
        Invite coworkers to verify your experience.
      </p>
      {sent ? (
        <p className="mt-4 text-sm font-medium text-emerald-600">
          Invite sent. We&apos;ll reach out to them.
        </p>
      ) : (
        <div className="mt-4 flex flex-col sm:flex-row gap-2">
          <input
            type="email"
            placeholder="coworker@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendInvite()}
            className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
          />
          <button
            type="button"
            onClick={sendInvite}
            disabled={loading}
            className="shrink-0 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Sending…" : "Invite Coworkers"}
          </button>
        </div>
      )}
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}

/** Viral email copy (subject + body) for referral invites. Use in Edge Function or Resend. */
export const REFERRAL_EMAIL = {
  subject: "Can you confirm we worked together?",
  body: `Hey,

I'm using WorkVouch to verify my work history, and it matched me with people I worked with.

It looks like you might've worked at the same place as me.

Can you confirm?

It takes 30 seconds:
👉 ${JOIN_URL}

This helps both of us boost our trust score and unlock better opportunities.

Appreciate it 🙌`,
  ctaUrl: JOIN_URL,
  ctaLabel: "Join PeerCV",
} as const;
