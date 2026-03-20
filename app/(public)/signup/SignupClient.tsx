"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { persistInviteTokenForSignup } from "@/components/invites/CoworkerInvitePanel";

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

      const role = "employee"; // role chosen later at select-role; pass default for metadata
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

      // Email confirmation OFF: user from signUp; mark claim-profile if from verification, then go to onboarding
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

      // Email confirmation ON: no session yet, ask user to check email
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
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 px-4 overflow-x-hidden">
      <Link href="/" className="mb-6">
        <Image
          src="/images/workvouch-logo.png.png"
          alt="WorkVouch"
          width={180}
          height={48}
          className="h-10 w-auto object-contain"
          priority
          style={{ objectFit: "contain" }}
        />
      </Link>
      <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg w-full max-w-md border border-gray-200 dark:border-gray-700">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#64748B] mb-2 text-center">
          Step 1 of 3
        </p>
        <h1 className="text-3xl font-bold mb-2 text-center text-gray-900 dark:text-white">
          Create account
        </h1>
        {coworkerInviteToken && (
          <p className="text-sm text-center mb-4 px-2 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-900 dark:text-emerald-100 border border-emerald-200 dark:border-emerald-800">
            You&apos;re joining through a coworker invite — you&apos;ll be linked when you finish signup so you can
            match on shared employers and grow trust together.
          </p>
        )}
        {sourceVerification && (
          <p className="text-sm text-center mb-4 px-2 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-800">
            You were invited to join WorkVouch after verifying a coworker.
          </p>
        )}
        <p className="text-gray-600 dark:text-gray-400 text-sm text-center mb-6">
          Full name, email, and password. Next you&apos;ll choose your role and complete setup.
        </p>
        <form onSubmit={(e) => { e.preventDefault(); handleSignup(); }} className="space-y-4">
          <input
            type="text"
            placeholder="Full Name (required)"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
            autoComplete="name"
          />
          <input
            type="email"
            placeholder="Email (required)"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
            autoComplete="email"
          />
          {sourceVerification && (
            <input
              type="text"
              placeholder="Company (optional)"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoComplete="organization"
            />
          )}
          <input
            type="password"
            placeholder="Password (min 8 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
            minLength={8}
            autoComplete="new-password"
          />
          {error && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm border border-red-200 dark:border-red-800">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Creating account…" : "Continue"}
          </button>
        </form>
        <p className="text-center mt-6 text-sm text-gray-600 dark:text-gray-400">
          Already have an account?{" "}
          <Link href="/login" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
