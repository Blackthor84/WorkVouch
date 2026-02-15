"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { isAdmin } from "@/lib/auth/isAdmin";

const SIGNUP_PLAN_KEY = "workvouch_signup_plan";

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = supabaseBrowser();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      setLoading(false);
      return;
    }

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: { full_name: fullName.trim() || undefined },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }

      if (!data.user) {
        setError("Account creation failed. Please try again.");
        setLoading(false);
        return;
      }

      const userRole = (data.user as { app_metadata?: { role?: string } }).app_metadata?.role ?? null;
      if (isAdmin({ role: userRole ?? undefined })) {
        router.push("/admin");
        return;
      }
      const { error: profileError } = await (supabase as any)
        .from("profiles")
        .insert({
          id: data.user.id,
          full_name: fullName.trim() || " ",
          email: email.trim().toLowerCase(),
          role: null,
        });

      if (profileError) {
        console.error("Profile insert error:", profileError);
        setError(profileError.message || "Could not create profile. Please try again.");
        setLoading(false);
        return;
      }

      // Store credentials + userId so select-role can work even if Supabase session isn't set yet (e.g. email confirm)
      try {
        sessionStorage.setItem(
          "workvouch_signup_credentials",
          JSON.stringify({
            email: email.trim().toLowerCase(),
            password,
            userId: data.user.id,
          })
        );
      } catch {
        // ignore if sessionStorage unavailable
      }

      router.push("/select-role");
    } catch (err) {
      console.error("Signup error:", err);
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
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
          Step 1 of 3
        </p>
        <h1 className="text-3xl font-bold mb-2 text-center text-gray-900 dark:text-white">
          Create account
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm text-center mb-6">
          Full name, email, and password. Next you&apos;ll choose your role and complete setup.
        </p>
        <form onSubmit={handleSignup} className="space-y-4">
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
