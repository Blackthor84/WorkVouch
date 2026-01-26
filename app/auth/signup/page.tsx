"use client";

import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { employeePricing, employerPricing } from "@/lib/cursor-bundle";
import Link from "next/link";
import supabase from "@/lib/supabaseClient";

type Role = "employee" | "employer";

export default function SignUpPage() {
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

  // Sync prefill plan when URL changes
  useEffect(() => {
    if (prefillPlan) {
      setSelectedPlan(prefillPlan);
      // Determine role based on plan
      const isEmployerPlan = employerPricing.some(p => p.tier === prefillPlan);
      const isEmployeePlan = employeePricing.some(p => p.tier === prefillPlan);
      if (isEmployerPlan) setRole("employer");
      if (isEmployeePlan) setRole("employee");
    }
  }, [prefillPlan]);

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRole(e.target.value as Role);
    setSelectedPlan(""); // reset plan on role change
  };

  const plans = role === "employee" ? employeePricing : employerPricing;

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      // Auto-assign free plan for workers
      const finalPlan = role === "employee" ? "free" : selectedPlan;

      // If employer didn't select a plan, redirect to pricing
      if (role === "employer" && !selectedPlan) {
        setMessage("Please select a plan to continue.");
        setLoading(false);
        setTimeout(() => {
          router.push("/pricing?userType=employer");
        }, 1500);
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: {
            full_name: fullName,
            role: role,
            plan: finalPlan,
          },
        },
      });

      if (error) {
        setMessage(`Error: ${error.message}`);
        setLoading(false);
        return;
      }

      if (data.user) {
        // Create profile with role and plan
        const { error: profileError } = await supabase
          .from("profiles")
          .insert({
            id: data.user.id,
            email: email,
            full_name: fullName,
            role: role,
          });

        if (profileError) {
          console.error("Profile creation error:", profileError);
        }

        // If employer, create employer_account with selected plan
        if (role === "employer" && selectedPlan) {
          const { error: employerError } = await supabase
            .from("employer_accounts")
            .insert({
              user_id: data.user.id,
              company_name: fullName, // Temporary, can be updated later
              plan_tier: selectedPlan,
            });

          if (employerError) {
            console.error("Employer account creation error:", employerError);
          }
        }

        if (data.session) {
          setMessage("Account created successfully! Redirecting...");
          setTimeout(() => {
            // Redirect based on role
            if (role === "employer") {
              router.push("/dashboard/employer");
            } else {
              router.push("/dashboard/worker");
            }
            router.refresh();
          }, 500);
        } else {
          setMessage("Check your email to confirm your account!");
          setLoading(false);
        }
      } else {
        setMessage("Error: Account creation failed. Please try again.");
        setLoading(false);
      }
    } catch (err: any) {
      console.error("Sign up error:", err);
      setMessage(`Error: ${err.message || "An unexpected error occurred"}`);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-12 space-y-8">
      <h1 className="text-4xl font-bold mb-6">Sign Up for WorkVouch</h1>

      {/* Role Selector */}
      <div className="space-y-2">
        <label className="block font-semibold">I am a:</label>
        <select
          value={role}
          onChange={handleRoleChange}
          className="border rounded p-2 w-full"
          disabled={loading}
        >
          <option value="employee">Employee</option>
          <option value="employer">Employer</option>
        </select>
      </div>

      {/* Plan Selection */}
      {role === "employee" ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-2 text-green-800">
            WorkVouch is Always Free for Workers!
          </h2>
          <p className="text-green-700 mb-4">
            You'll automatically get the free plan with full access to all worker features.
          </p>
          <ul className="list-disc list-inside space-y-2 text-green-700">
            <li>Create your profile</li>
            <li>Add unlimited job history</li>
            <li>Match with coworkers</li>
            <li>Receive peer references</li>
            <li>Build your verified profile</li>
            <li>View your trust score</li>
          </ul>
        </div>
      ) : (
        <div>
          <h2 className="text-2xl font-semibold mb-4">Select a Plan</h2>
          <p className="text-gray-600 mb-4">
            Choose the plan that fits your hiring needs. You can upgrade or downgrade anytime.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((p) => (
              <div
                key={p.tier}
                className={`border rounded-xl p-4 cursor-pointer hover:shadow-lg transition ${
                  selectedPlan === p.tier ? "border-blue-600 bg-blue-50" : "bg-white"
                }`}
                onClick={() => !loading && setSelectedPlan(p.tier)}
              >
                <h3 className="text-xl font-bold">{p.tier}</h3>
                <p className="text-lg font-semibold text-blue-700">{p.price}</p>
                <ul className="list-disc list-inside mt-2 space-y-1 text-sm text-gray-700">
                  {p.benefits.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          {!selectedPlan && (
            <p className="text-red-600 text-sm mt-2">
              Please select a plan to continue
            </p>
          )}
        </div>
      )}

      {/* Signup Form */}
      <form onSubmit={handleSignUp} className="space-y-4">
        <div>
          <label className="block font-semibold mb-2">Full Name</label>
          <input
            type="text"
            placeholder="John Doe"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="border rounded p-2 w-full"
            required
            disabled={loading}
          />
        </div>
        <div>
          <label className="block font-semibold mb-2">Email</label>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border rounded p-2 w-full"
            required
            disabled={loading}
          />
        </div>
        <div>
          <label className="block font-semibold mb-2">Password</label>
          <input
            type="password"
            placeholder="Enter a password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border rounded p-2 w-full"
            required
            disabled={loading}
          />
        </div>

        {/* Hidden field for selected plan */}
        <input type="hidden" name="plan" value={selectedPlan} />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white p-3 rounded hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Creating account..." : "Sign Up"}
        </button>
      </form>

      {message && (
        <div
          className={`text-center p-4 rounded-xl ${
            message.includes("Error")
              ? "bg-red-50 text-red-800 border border-red-200"
              : "bg-green-50 text-green-800 border border-green-200"
          }`}
        >
          {message}
        </div>
      )}

      <p className="text-sm mt-4 text-center">
        Already have an account?{" "}
        <Link href="/auth/signin" className="text-blue-600 underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
