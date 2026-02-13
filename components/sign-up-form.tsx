"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";
import { getIndustriesForSignup, INDUSTRY_TO_ONBOARDING_KEY } from "@/lib/constants/industries";

export function SignUpForm() {
  const router = useRouter();
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
    setLoading(true);
    setError(null);

    try {
      console.log("Attempting signup...");
      // Prepare metadata based on user type
      const metadata: any = {
        full_name: fullName,
        user_type: userType, // Track user type
      };

      // Only add industry for employees
      if (userType === "employee") {
        metadata.industry = industry;
        metadata.role = "user";
      } else {
        // For employers, set role to employer and add company name
        metadata.role = "employer";
        if (companyName) {
          metadata.company_name = companyName;
        }
      }

      // Using single supabase instance
      const { data, error: signUpError } = await supabaseBrowser.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
        },
      });

      console.log("Signup response:", { data, error: signUpError });

      if (signUpError) {
        console.error("Signup error:", signUpError);
        throw signUpError;
      }

      if (data.user) {
        console.log("User created, waiting for profile and role...");
        console.log("Session:", data.session);

        // Wait for profile and role trigger to complete
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Check if email confirmation is required
        if (data.session) {
          // User is automatically signed in with Supabase; establish NextAuth session so dashboard doesn't redirect to login
          console.log("Signup successful, signing in with NextAuth...");
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
          const result = await signIn("credentials", {
            email: email.trim().toLowerCase(),
            password,
            callbackUrl,
            redirect: false,
          });
          if (result?.ok && result?.url) {
            window.location.href = result.url;
            return;
          }
          // Fallback: redirect anyway (user may need to log in if NextAuth failed)
          window.location.href = callbackUrl;
        } else {
          // Email confirmation might be required, but try to sign in anyway
          console.log("No session, attempting to sign in...");
          const { data: signInData, error: signInError } =
            await supabaseBrowser.auth.signInWithPassword({
              email,
              password,
            });

          if (signInError) {
            console.error("Sign in error:", signInError);
            setError(
              "Account created! Please check your email to confirm your account, then sign in.",
            );
          } else if (signInData.session) {
            console.log("Signed in with Supabase, signing in with NextAuth...");
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
            const result = await signIn("credentials", {
              email: email.trim().toLowerCase(),
              password,
              callbackUrl,
              redirect: false,
            });
            if (result?.ok && result?.url) {
              window.location.href = result.url;
              return;
            }
            window.location.href = callbackUrl;
          } else {
            setError(
              "Account created! Please check your email to confirm your account, then sign in.",
            );
          }
        }
      } else {
        throw new Error("No user data returned");
      }
    } catch (err: any) {
      console.error("Signup failed:", err);
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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
        {loading ? "Creating account..." : "Create Account"}
      </Button>
    </form>
  );
}
