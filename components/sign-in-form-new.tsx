"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";
import { supabaseBrowser } from "@/lib/supabase/browser";

export function SignInFormNew() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [type, setType] = useState<"user" | "employer" | "admin">("user");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error: signInError } = await supabaseBrowser().auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message || "Invalid email or password");
        setLoading(false);
        return;
      }

      if (data?.session) {
        if (type === "user") {
          router.push("/dashboard");
        } else if (type === "employer") {
          router.push("/employer/dashboard");
        } else if (type === "admin") {
          router.push("/admin/dashboard");
        }
        router.refresh();
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
        <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 text-sm text-red-800 dark:text-red-300">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-semibold text-grey-dark dark:text-gray-200 mb-2">
          Account Type
        </label>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setType("user")}
            className={`px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
              type === "user"
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white dark:bg-[#111827] border-gray-300 dark:border-[#374151] text-grey-dark dark:text-gray-200"
            }`}
          >
            User
          </button>
          <button
            type="button"
            onClick={() => setType("employer")}
            className={`px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
              type === "employer"
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white dark:bg-[#111827] border-gray-300 dark:border-[#374151] text-grey-dark dark:text-gray-200"
            }`}
          >
            Employer
          </button>
          <button
            type="button"
            onClick={() => setType("admin")}
            className={`px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
              type === "admin"
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white dark:bg-[#111827] border-gray-300 dark:border-[#374151] text-grey-dark dark:text-gray-200"
            }`}
          >
            Admin
          </button>
        </div>
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
