"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function UpgradePageClient() {
  const searchParams = useSearchParams();
  const plan = searchParams.get("plan");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");

  useEffect(() => {
    // Get user email if available
    async function loadUser() {
      try {
        const response = await fetch("/api/user/me");
        if (response.ok) {
          const data = await response.json();
          if (data.user?.email) {
            setEmail(data.user.email);
          }
        }
      } catch (error) {
        console.error("Failed to load user:", error);
      }
    }
    loadUser();
  }, []);

  const handleUpgrade = async () => {
    if (!plan || !email) {
      alert("Please enter your email address");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, email }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create checkout session");
      }

      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      }
    } catch (error: any) {
      alert(error.message || "Failed to start upgrade process");
      setLoading(false);
    }
  };

  if (!plan || !["pro", "enterprise"].includes(plan)) {
    return (
      <div className="min-h-screen bg-background dark:bg-[#0D1117] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-grey-dark dark:text-gray-200">
            Invalid Plan
          </h1>
          <p className="text-grey-medium dark:text-gray-400 mb-4">
            Please select a valid plan from the pricing page.
          </p>
          <a
            href="/pricing"
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            Go to Pricing
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background dark:bg-[#0D1117] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white dark:bg-[#1A1F2B] rounded-2xl shadow-lg p-8">
        <h1 className="text-2xl font-bold mb-4 text-grey-dark dark:text-gray-200">
          Upgrade to {plan === "pro" ? "Professional" : "Enterprise"}
        </h1>
        <p className="text-grey-medium dark:text-gray-400 mb-6">
          Enter your email to continue with the upgrade process.
        </p>
        <div className="space-y-4">
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full border rounded-lg p-3 dark:bg-[#0D1117] dark:border-[#374151] dark:text-white"
          />
          <button
            onClick={handleUpgrade}
            disabled={loading || !email}
            className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400 text-white py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Processing..." : "Continue to Checkout"}
          </button>
          <a
            href="/pricing"
            className="block text-center text-sm text-grey-medium dark:text-gray-400 hover:underline"
          >
            Back to Pricing
          </a>
        </div>
      </div>
    </div>
  );
}
