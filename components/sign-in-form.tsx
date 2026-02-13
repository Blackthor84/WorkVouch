"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";

export function SignInForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      console.log("Attempting sign in...");
      // Using single supabase instance
      const { data, error: signInError } =
        await supabaseBrowser.auth.signInWithPassword({
          email,
          password,
        });

      console.log("Sign in response:", { data, error: signInError });

      if (signInError) {
        console.error("Sign in error:", signInError);
        throw signInError;
      }

      if (data.session) {
        console.log("✅ Sign in successful!");
        // Force session refresh so cookies are written before navigation
        await supabaseBrowser.auth.getSession();
        console.log("🔄 Redirecting to dashboard...");
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 100);
        router.push("/dashboard");
        return;
      } else {
        console.error("❌ No session in response");
        throw new Error("No session created");
      }
    } catch (err: any) {
      console.error("Sign in failed:", err);
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-800">
          {error}
        </div>
      )}

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
          htmlFor="password"
          className="block text-sm font-semibold text-grey-dark dark:text-gray-200 mb-2"
        >
          Password
        </label>
        <input
          id="password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-xl border bg-white dark:bg-[#111827] text-grey-dark dark:text-gray-200 border-gray-300 dark:border-[#374151] px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          placeholder="••••••••"
        />
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Signing in..." : "Sign In"}
      </Button>
    </form>
  );
}
