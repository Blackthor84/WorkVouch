"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";
import { getIndustriesForSignup, INDUSTRY_TO_ONBOARDING_KEY } from "@/lib/constants/industries";

export function SignUpForm() {
  const router = useRouter();
  const supabase = supabaseBrowser;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [userType, setUserType] = useState<"employee" | "employer">("employee");
  const [industry, setIndustry] = useState<string>("");
  const [companyName, setCompanyName] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      setError("Email and password are required");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabaseBrowser.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
      if (!data?.user) throw new Error("Signup failed");

      // Post-signup: redirect (profile is created by DB trigger on auth.users)
      await new Promise((r) => setTimeout(r, 1000));

      if (data.session) {
        await supabase.auth.getSession();
        await new Promise((r) => setTimeout(r, 150));
        const key = industry ? INDUSTRY_TO_ONBOARDING_KEY[industry as keyof typeof INDUSTRY_TO_ONBOARDING_KEY] : undefined;
        const callbackUrl =
          userType === "employer"
            ? "/employer/dashboard"
            : key === "warehousing"
              ? "/onboarding/warehouse"
              : key === "healthcare"
                ? "/onboarding/healthcare/role"
                : key
                  ? `/onboarding/${key}/role`
                  : "/dashboard";
        window.location.href = callbackUrl;
        return;
      }

      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });
      if (signInError) {
        setLoading(false);
        setError("Account created! Please check your email to confirm your account, then sign in.");
        return;
      }
      if (signInData?.session) {
        await supabase.auth.getSession();
        await new Promise((r) => setTimeout(r, 150));
        const key = industry ? INDUSTRY_TO_ONBOARDING_KEY[industry as keyof typeof INDUSTRY_TO_ONBOARDING_KEY] : undefined;
        const callbackUrl =
          userType === "employer"
            ? "/employer/dashboard"
            : key === "warehousing"
              ? "/onboarding/warehouse"
              : key === "healthcare"
                ? "/onboarding/healthcare/role"
                : key
                  ? `/onboarding/${key}/role`
                  : "/dashboard";
        window.location.href = callbackUrl;
        return;
      }
      setLoading(false);
      setError("Account created! Please check your email to confirm your account, then sign in.");
    } catch (err) {
      setLoading(false);
      setError(err instanceof Error ? err.message : "Signup failed");
      return;
    }
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); handleSubmit(e); }} className="space-y-6">
      {error && (
        <div
          className={`rounded-xl border p-4 text-sm ${
            error.includes("created") || error.includes("confirm")
              ? "bg-green-50 border-green-200 text-green-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          {error}
        </div>
      )}

      <div>
        <label
          htmlFor="fullName"
          className="block text-sm font-semibold text-grey-dark dark:text-gray-200 mb-2"
        >
          Full Name
        </label>
        <input
          id="fullName"
          type="text"
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="w-full rounded-xl border bg-white dark:bg-[#111827] text-grey-dark dark:text-gray-200 border-gray-300 dark:border-[#374151] px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          placeholder="John Doe"
        />
      </div>

      <div>
        <label
          htmlFor="email"
          className="block text-sm font-semibold text-grey-dark dark:text-gray-200 mb-2"
        >
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-xl border bg-white dark:bg-[#111827] text-grey-dark dark:text-gray-200 border-gray-300 dark:border-[#374151] px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          placeholder="you@example.com"
        />
      </div>

      <div>
        <label
          htmlFor="userType"
          className="block text-sm font-semibold text-grey-dark dark:text-gray-200 mb-2"
        >
          I am signing up as *
        </label>
        <select
          id="userType"
          required
          value={userType}
          onChange={(e) => {
            setUserType(e.target.value as "employee" | "employer");
            if (e.target.value === "employer") {
              setIndustry(""); // Clear industry for employers
            }
          }}
          className="w-full rounded-xl border bg-white dark:bg-[#111827] text-grey-dark dark:text-gray-200 border-gray-300 dark:border-[#374151] px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
        >
          <option value="employee">Employee / Job Seeker</option>
          <option value="employer">Employer / Company</option>
        </select>
      </div>

      {userType === "employee" && (
        <div>
          <label
            htmlFor="industry"
            className="block text-sm font-semibold text-grey-dark dark:text-gray-200 mb-2"
          >
            Industry *
          </label>
          <select
            id="industry"
            required={userType === "employee"}
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            className="w-full rounded-xl border bg-white dark:bg-[#111827] text-grey-dark dark:text-gray-200 border-gray-300 dark:border-[#374151] px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          >
            <option value="">Select your industry</option>
            {getIndustriesForSignup().map((ind) => (
              <option key={ind} value={ind}>
                {ind}
              </option>
            ))}
          </select>
        </div>
      )}

      {userType === "employer" && (
        <div>
          <label
            htmlFor="companyName"
            className="block text-sm font-semibold text-grey-dark dark:text-gray-200 mb-2"
          >
            Company Name *
          </label>
          <input
            id="companyName"
            type="text"
            required={userType === "employer"}
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            className="w-full rounded-xl border bg-white dark:bg-[#111827] text-grey-dark dark:text-gray-200 border-gray-300 dark:border-[#374151] px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            placeholder="Acme Corporation"
          />
        </div>
      )}

      <div>
        <label
          htmlFor="password"
          className="block text-sm font-semibold text-grey-dark dark:text-gray-200 mb-2"
        >
          Password
        </label>
        <input
          id="password"
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-xl border bg-white dark:bg-[#111827] text-grey-dark dark:text-gray-200 border-gray-300 dark:border-[#374151] px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          placeholder="••••••••"
        />
        <p className="mt-1 text-xs text-grey-dark dark:text-gray-200 font-semibold">
          Minimum 6 characters
        </p>
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Creating account..." : "Sign Up"}
      </Button>
    </form>
  );
}
