"use client";

import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { employeePricing, employerPricing } from "@/lib/cursor-bundle";
import Link from "next/link";
import Image from "next/image";
import { supabaseBrowser } from "@/lib/supabase/client";

type Role = "employee" | "employer";

const LOGO_SRC = "/images/workvouch-logo.png.png";

export default function SignupClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefillPlan = searchParams.get("plan") || "";

  const [role, setRole] = useState<Role>("employee");
  const [selectedPlan, setSelectedPlan] = useState(prefillPlan);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (prefillPlan) {
      setSelectedPlan(prefillPlan);
      const isEmployerPlan = employerPricing.some((p) => p.tier === prefillPlan);
      const isEmployeePlan = employeePricing.some((p) => p.tier === prefillPlan);
      if (isEmployerPlan) setRole("employer");
      if (isEmployeePlan) setRole("employee");
    }
  }, [prefillPlan]);

  const handleRoleChange = (newRole: Role) => {
    if (loading) return;
    setRole(newRole);
    setSelectedPlan("");
  };

  const plans = role === "employee" ? employeePricing : employerPricing;

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const finalPlan = role === "employee" ? "free" : selectedPlan;

      if (role === "employer" && !selectedPlan) {
        setMessage("Please select a plan to continue.");
        setLoading(false);
        setTimeout(() => router.push("/pricing?userType=employer"), 1500);
        return;
      }

      if (password.length < 8) {
        setMessage("Password must be at least 8 characters.");
        setLoading(false);
        return;
      }

      const { data, error } = await supabaseBrowser.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: {
            full_name: fullName,
            role: role === "employer" ? "employer" : "user",
            plan: finalPlan,
          },
        },
      });

      if (error) {
        setMessage(error.message || "Something went wrong. Please try again.");
        setLoading(false);
        return;
      }

      if (data.user) {
        const profileRole = role === "employer" ? "employer" : "user";
        const { error: profileError } = await (supabaseBrowser as any)
          .from("profiles")
          .insert({
            id: data.user.id,
            email: email.trim().toLowerCase(),
            full_name: fullName || " ",
            role: profileRole,
          });

        if (profileError) {
          console.error("Profile insert error:", profileError);
          setMessage(profileError.message || "Could not create profile. Please try again.");
          setLoading(false);
          return;
        }

        if (role === "employer" && selectedPlan) {
          const planTierMap: Record<string, "free" | "basic" | "pro"> = {
            starter: "basic",
            team: "pro",
            pro: "pro",
            security: "pro",
            "security-bundle": "pro",
            "pay-per-use": "free",
          };
          const dbPlanTier = planTierMap[selectedPlan] ?? "free";

          const { error: employerError } = await (supabaseBrowser as any)
            .from("employer_accounts")
            .insert({
              user_id: data.user.id,
              company_name: fullName?.trim() || "Company",
              plan_tier: dbPlanTier,
            });

          if (employerError) {
            console.error("Employer account insert error:", employerError);
            setMessage(employerError.message || "Could not create employer account. Please try again.");
            setLoading(false);
            return;
          }
        }

        if (data.session) {
          setMessage("Account created! Redirecting...");
          setTimeout(() => {
            router.push(role === "employer" ? "/dashboard/employer" : "/dashboard/worker");
            router.refresh();
          }, 500);
        } else {
          setMessage("Check your email to confirm your account.");
          setLoading(false);
        }
      } else {
        setMessage("Account creation failed. Please try again.");
        setLoading(false);
      }
    } catch (err: unknown) {
      console.error("Sign up error:", err);
      setMessage("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link href="/" className="inline-flex items-center">
            <Image
              src={LOGO_SRC}
              alt="WorkVouch"
              width={180}
              height={48}
              className="h-10 w-auto object-contain"
              priority
              style={{ objectFit: "contain" }}
            />
          </Link>
        </div>

        {/* Card container */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-6 sm:p-8 space-y-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white text-center">
              Create your account
            </h1>

            {/* Role selector: pill buttons */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                I am a
              </label>
              <div className="flex rounded-xl bg-gray-100 dark:bg-gray-700 p-1 gap-1">
                <button
                  type="button"
                  onClick={() => handleRoleChange("employee")}
                  disabled={loading}
                  className={`flex-1 py-3 px-4 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    role === "employee"
                      ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  } ${loading ? "opacity-60 cursor-not-allowed" : ""}`}
                >
                  Employee
                </button>
                <button
                  type="button"
                  onClick={() => handleRoleChange("employer")}
                  disabled={loading}
                  className={`flex-1 py-3 px-4 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    role === "employer"
                      ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  } ${loading ? "opacity-60 cursor-not-allowed" : ""}`}
                >
                  Employer
                </button>
              </div>
            </div>

            {/* Plan / benefits section */}
            {role === "employee" ? (
              <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-900/10 p-5 sm:p-6">
                <h2 className="text-lg font-semibold text-emerald-800 dark:text-emerald-200 mb-1">
                  Always free for workers
                </h2>
                <p className="text-sm text-emerald-700 dark:text-emerald-300 mb-4">
                  Full access to profile, references, and trust score.
                </p>
                <ul className="space-y-2 text-sm text-emerald-800 dark:text-emerald-200">
                  {employeePricing[0].benefits.slice(0, 6).map((b, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="text-emerald-500 dark:text-emerald-400">✓</span>
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="space-y-3">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Choose a plan
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  You can change or cancel anytime.
                </p>
                <div className="grid sm:grid-cols-2 gap-3">
                  {plans.map((p) => (
                    <button
                      key={p.tier}
                      type="button"
                      onClick={() => !loading && setSelectedPlan(p.tier)}
                      disabled={loading}
                      className={`text-left p-4 rounded-xl border-2 transition-all duration-200 hover:shadow-md ${
                        selectedPlan === p.tier
                          ? "border-blue-600 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                          : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
                      } ${loading ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
                    >
                      <h3 className="font-semibold text-gray-900 dark:text-white">{p.tier}</h3>
                      <p className="text-sm text-blue-600 dark:text-blue-400 font-medium mt-0.5">
                        {p.price}
                      </p>
                      <ul className="mt-2 space-y-1 text-xs text-gray-600 dark:text-gray-400">
                        {p.benefits.slice(0, 3).map((b, i) => (
                          <li key={i}>{b}</li>
                        ))}
                      </ul>
                    </button>
                  ))}
                </div>
                {role === "employer" && !selectedPlan && (
                  <p className="text-sm text-amber-600 dark:text-amber-400">
                    Please select a plan to continue.
                  </p>
                )}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSignUp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Full name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Jane Smith"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                  required
                  disabled={loading}
                  autoComplete="name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                  required
                  disabled={loading}
                  autoComplete="email"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                  required
                  minLength={8}
                  disabled={loading}
                  autoComplete="new-password"
                />
              </div>

              {message && (
                <div
                  className={`p-4 rounded-lg text-sm ${
                    message.includes("Error") || message.includes("Please")
                      ? "bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800"
                      : "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800"
                  }`}
                >
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm hover:shadow transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-sm"
              >
                {loading ? "Creating account..." : "Create account"}
              </button>
            </form>

            <p className="text-center text-sm text-gray-600 dark:text-gray-400">
              Already have an account?{" "}
              <Link
                href="/auth/signin"
                className="text-blue-600 dark:text-blue-400 font-medium hover:underline"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
