"use client";

import { useState } from "react";
import { WvCard, WvButton, WvInput } from "@/components/wv";

const JOIN_URL = process.env.NEXT_PUBLIC_APP_URL || "https://app.workvouch.com";

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
    <WvCard hover className={className}>
      <h3 className="text-lg font-semibold text-wv-foreground">Boost your Trust Score</h3>
      <p className="mt-2 text-sm text-wv-muted">Invite coworkers to verify your experience.</p>
      {sent ? (
        <p className="mt-4 text-sm font-medium text-emerald-400">
          Invite sent. We&apos;ll reach out to them.
        </p>
      ) : (
        <div className="mt-4 flex flex-col sm:flex-row gap-2">
          <WvInput
            type="email"
            placeholder="coworker@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendInvite()}
            className="flex-1"
          />
          <WvButton type="button" onClick={sendInvite} disabled={loading} className="shrink-0">
            {loading ? "Sending…" : "Invite Coworkers"}
          </WvButton>
        </div>
      )}
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </WvCard>
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
  ctaLabel: "Join WorkVouch",
} as const;
