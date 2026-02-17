"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

const SIGNUP_CREDENTIALS_KEY = "workvouch_signup_credentials";
const SIGNUP_PLAN_KEY = "workvouch_signup_plan";

/** Minimal user shape for role selection (id for updates; email optional for company name). */
type UserOrId = User | { id: string; email?: string };

export default function SelectRolePage() {
  const router = useRouter();
  const supabase = supabaseBrowser;
  const [user, setUser] = useState<UserOrId | null>(null);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    // If we have stored signup credentials with userId, we can show role selection without Supabase session
    try {
      const raw = sessionStorage.getItem(SIGNUP_CREDENTIALS_KEY);
      if (raw) {
        const stored = JSON.parse(raw) as { email?: string; password?: string; userId?: string };
        if (stored?.userId && stored?.email && stored?.password) {
          setUser({ id: stored.userId, email: stored.email });
          setLoading(false);
          return;
        }
      }
    } catch {
      // ignore
    }
    const checkSession = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        router.replace("/signup");
        return;
      }

      const session = data.session;

      if (!session?.user) {
        router.replace("/signup");
        return;
      }

      setUser(session.user);
      setLoading(false);
    };

    checkSession();
  }, [router]);

  async function handleSelect(role: "user" | "employer") {
    if (!user) return;
    setError("");
    setSelecting(role);

    try {
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ role: role === "employer" ? "employer" : "user" })
        .eq("id", user.id);

      if (profileError) {
        setError(profileError.message || "Could not update profile.");
        setSelecting(null);
        return;
      }

      let employerPlanTier: string | undefined;
      if (role === "employer") {
        try {
          const planRaw = sessionStorage.getItem(SIGNUP_PLAN_KEY);
          if (planRaw) {
            const plan = JSON.parse(planRaw) as { plan_tier?: string };
            if (plan?.plan_tier && ["starter", "pro", "custom"].includes(plan.plan_tier)) {
              employerPlanTier = plan.plan_tier;
            }
          }
        } catch {
          /* ignore */
        }
        const { error: employerError } = await supabase
          .from("employer_accounts")
          .insert({
            user_id: user.id,
            company_name: user.email?.split("@")[0] ?? "New Company",
            plan_tier: employerPlanTier ?? "free",
          });

        if (employerError) {
          setError(employerError.message || "Could not create employer account.");
          setSelecting(null);
          return;
        }
      }

      // Redirect to onboarding: employee → profile (add first job); employer → dashboard with welcome
      const employeeOnboardingUrl = "/profile";
      let employerUrl = "/employer/dashboard?welcome=1";
      if (employerPlanTier && employerPlanTier !== "free" && employerPlanTier !== "custom") {
        try {
          const planRaw = sessionStorage.getItem(SIGNUP_PLAN_KEY);
          const interval = planRaw ? (JSON.parse(planRaw) as { interval?: string })?.interval : undefined;
          const q = new URLSearchParams({ plan_tier: employerPlanTier, welcome: "1" });
          if (interval === "yearly" || interval === "monthly") q.set("interval", interval);
          employerUrl = `/employer/upgrade?${q.toString()}`;
          sessionStorage.removeItem(SIGNUP_PLAN_KEY);
        } catch {
          // keep employerUrl as dashboard
        }
      }

      const callbackUrl = role === "employer" ? employerUrl : employeeOnboardingUrl;
      try {
        sessionStorage.removeItem(SIGNUP_CREDENTIALS_KEY);
      } catch {
        // ignore
      }
      router.push(callbackUrl);
    } catch (err) {
      console.error("Select role error:", err);
      setError("An unexpected error occurred. Please try again.");
      setSelecting(null);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 px-4">
        <p className="text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

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
          Step 2 of 3
        </p>
        <h1 className="text-2xl font-bold mb-2 text-center text-gray-900 dark:text-white">
          I am a:
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm text-center mb-6">
          You&apos;ll go straight to setup. No extra steps.
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm border border-red-200 dark:border-red-800">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <button
            type="button"
            onClick={() => handleSelect("user")}
            disabled={!!selecting}
            className="w-full p-4 rounded-xl border-2 border-gray-200 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {selecting === "user" ? "Setting up…" : "Employee"}
          </button>
          <button
            type="button"
            onClick={() => handleSelect("employer")}
            disabled={!!selecting}
            className="w-full p-4 rounded-xl border-2 border-gray-200 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {selecting === "employer" ? "Setting up…" : "Employer"}
          </button>
        </div>

        <p className="text-center mt-6 text-sm text-gray-600 dark:text-gray-400">
          <Link href="/login" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
            Already have an account? Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
