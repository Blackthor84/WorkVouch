"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { supabaseBrowser } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

const SIGNUP_CREDENTIALS_KEY = "workvouch_signup_credentials";

/** Minimal user shape for role selection (we only need id for profile/role updates). */
type UserOrId = User | { id: string };

export default function SelectRolePage() {
  const router = useRouter();
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
          setUser({ id: stored.userId });
          setLoading(false);
          return;
        }
      }
    } catch {
      // ignore
    }
    supabaseBrowser.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) {
        router.replace("/signup");
        return;
      }
      setUser(session.user);
      setLoading(false);
    });
  }, [router]);

  async function handleSelect(role: "user" | "employer") {
    if (!user) return;
    setError("");
    setSelecting(role);

    const supabaseAny = supabaseBrowser as any;

    try {
      const { error: profileError } = await supabaseAny
        .from("profiles")
        .update({ role: role === "employer" ? "employer" : "user" })
        .eq("id", user.id);

      if (profileError) {
        setError(profileError.message || "Could not update profile.");
        setSelecting(null);
        return;
      }

      const { error: roleError } = await supabaseAny
        .from("user_roles")
        .insert({ user_id: user.id, role: role === "employer" ? "employer" : "user" });

      if (roleError) {
        setError(roleError.message || "Could not set role.");
        setSelecting(null);
        return;
      }

      if (role === "employer") {
        const { error: employerError } = await supabaseAny
          .from("employer_accounts")
          .insert({
            user_id: user.id,
            company_name: user.user_metadata?.full_name || "Company",
            plan_tier: "free",
          });

        if (employerError) {
          setError(employerError.message || "Could not create employer account.");
          setSelecting(null);
          return;
        }
      }

      const callbackUrl = role === "employer" ? "/employer/dashboard" : "/dashboard";

      // If we have stored signup credentials, sign in with NextAuth and go straight to dashboard (no second login)
      let stored: { email?: string; password?: string } | null = null;
      try {
        const raw = sessionStorage.getItem(SIGNUP_CREDENTIALS_KEY);
        if (raw) stored = JSON.parse(raw) as { email?: string; password?: string };
      } catch {
        // ignore
      }
      if (stored?.email && stored?.password) {
        try {
          sessionStorage.removeItem(SIGNUP_CREDENTIALS_KEY);
        } catch {
          // ignore
        }
        const result = await signIn("credentials", {
          email: stored.email,
          password: stored.password,
          callbackUrl,
          redirect: false,
        });
        if (result?.ok && result?.url) {
          router.push(result.url);
          router.refresh();
          return;
        }
      }

      // No stored credentials (e.g. arrived from email link): redirect to login with callback
      router.push(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
      router.refresh();
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
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 px-4">
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
        <h1 className="text-2xl font-bold mb-2 text-center text-gray-900 dark:text-white">
          I am a:
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm text-center mb-6">
          Choose how you&apos;ll use WorkVouch. You&apos;ll go straight to your dashboard.
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
            {selecting === "user" ? "Setting up..." : "Employee"}
          </button>
          <button
            type="button"
            onClick={() => handleSelect("employer")}
            disabled={!!selecting}
            className="w-full p-4 rounded-xl border-2 border-gray-200 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {selecting === "employer" ? "Setting up..." : "Employer"}
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
