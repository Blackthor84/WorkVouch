"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { persistInviteTokenForSignup } from "@/components/invites/CoworkerInvitePanel";
import { WvShell, WvCard, WvButton, WvInput, WvBadge } from "@/components/wv";

let signupAlreadyAttempted = false;

const SIGNUP_PLAN_KEY = "workvouch_signup_plan";

export default function SignupClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const sourceVerification = searchParams.get("source") === "verification";
  const coworkerInviteToken = searchParams.get("invite")?.trim() ?? "";
  const prefilledEmail = searchParams.get("email")?.trim() ?? "";
  const prefilledCompany = searchParams.get("company")?.trim() ?? "";
  const didPrefill = useRef(false);

  useEffect(() => {
    if (coworkerInviteToken) persistInviteTokenForSignup(coworkerInviteToken);
  }, [coworkerInviteToken]);

  useEffect(() => {
    if (didPrefill.current) return;
    if (prefilledEmail || prefilledCompany) {
      didPrefill.current = true;
      if (prefilledEmail) setEmail(prefilledEmail);
      if (prefilledCompany) setCompany(prefilledCompany);
    }
  }, [prefilledEmail, prefilledCompany]);

  useEffect(() => {
    const planTier = searchParams.get("plan_tier")?.trim();
    const interval = searchParams.get("interval")?.trim();
    if (planTier || interval) {
      try {
        sessionStorage.setItem(
          SIGNUP_PLAN_KEY,
          JSON.stringify({
            plan_tier: planTier && ["starter", "pro", "custom"].includes(planTier) ? planTier : undefined,
            interval: interval === "yearly" || interval === "monthly" ? interval : undefined,
          })
        );
      } catch {
        // ignore
      }
    }
  }, [searchParams]);

  const handleSignup = async () => {
    if (signupAlreadyAttempted) return;
    signupAlreadyAttempted = true;

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password) {
      setError("Email and password are required");
      signupAlreadyAttempted = false;
      return;
    }

    try {
      setLoading(true);
      setError("");

      const role = "employee";
      const username = cleanEmail.split("@")[0] || undefined;
      const inviteTok = searchParams.get("invite")?.trim() ?? "";

      const { data, error } = await supabaseBrowser.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            full_name: fullName.trim() || undefined,
            role,
            username,
            ...(inviteTok ? { coworker_invite_token: inviteTok } : {}),
          },
          emailRedirectTo:
            typeof window !== "undefined"
              ? `${window.location.origin}/auth/callback`
              : undefined,
        },
      });

      if (error) {
        setError(error.message);
        signupAlreadyAttempted = false;
        return;
      }

      if (data.user) {
        if (sourceVerification) {
          try {
            await fetch("/api/verification/claim-profile", { method: "POST", credentials: "include" });
          } catch {
            // non-blocking
          }
        }
        router.push("/onboarding");
        return;
      }

      router.push("/check-email");
    } catch (err) {
      console.error("Signup error:", err);
      setError(err instanceof Error ? err.message : "Signup failed");
      signupAlreadyAttempted = false;
    } finally {
      setLoading(false);
    }
  };

  return (
    <WvShell>
      <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
        <Link href="/" className="mb-8 flex items-center gap-2.5 rounded-lg" aria-label="WorkVouch home">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 text-sm font-bold text-white shadow-lg">
            WV
          </span>
          <span className="text-lg font-bold text-wv-foreground">WorkVouch</span>
        </Link>

        <WvCard glow className="w-full max-w-md">
          <WvBadge variant="brand" className="mx-auto mb-3 block w-fit">
            Step 1 of 3
          </WvBadge>
          <h1 className="text-2xl font-bold text-center text-wv-foreground">Create account</h1>

          {coworkerInviteToken && (
            <p className="text-sm text-center mt-4 px-3 py-2.5 rounded-xl bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
              You&apos;re joining through a coworker invite — you&apos;ll be linked when you finish signup so you can
              match on shared employers and grow trust together.
            </p>
          )}
          {sourceVerification && (
            <p className="text-sm text-center mt-4 px-3 py-2.5 rounded-xl bg-blue-500/10 text-blue-300 border border-blue-500/30">
              You were invited to join WorkVouch after verifying a coworker.
            </p>
          )}
          <p className="text-wv-muted text-sm text-center mt-4 mb-6">
            Full name, email, and password. Next you&apos;ll choose your role and complete setup.
          </p>

          <form onSubmit={(e) => { e.preventDefault(); handleSignup(); }} className="space-y-4">
            <WvInput
              label="Full name"
              type="text"
              placeholder="Full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              autoComplete="name"
            />
            <WvInput
              label="Email"
              type="email"
              placeholder="you@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
            {sourceVerification && (
              <WvInput
                label="Company (optional)"
                type="text"
                placeholder="Company name"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                autoComplete="organization"
              />
            )}
            <WvInput
              label="Password"
              type="password"
              placeholder="Min 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />
            {error && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}
            <WvButton type="submit" disabled={loading} className="w-full" size="lg">
              {loading ? "Creating account…" : "Continue"}
            </WvButton>
          </form>

          <p className="text-center mt-6 text-sm text-wv-muted">
            Already have an account?{" "}
            <Link href="/login" className="text-blue-400 hover:text-blue-300 font-medium">
              Log in
            </Link>
          </p>
        </WvCard>
      </div>
    </WvShell>
  );
}
