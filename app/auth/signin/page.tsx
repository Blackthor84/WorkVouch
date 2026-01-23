"use client"; // ensures this page runs on the client only

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseClient } from "@/lib/supabase/client";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setMessage(`Error: ${error.message}`);
        setLoading(false);
        return;
      }

      if (data.session) {
        setMessage("Signed in successfully! Redirecting...");
        // Wait a moment for session to be set, then redirect
        setTimeout(() => {
          router.push("/dashboard");
          router.refresh();
        }, 300);
      } else {
        setMessage("Error: No session created. Please try again.");
        setLoading(false);
      }
    } catch (err: any) {
      console.error("Sign in error:", err);
      setMessage(`Error: ${err.message || "An unexpected error occurred"}`);
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 md:py-12 lg:py-16">
      <div className="w-full flex flex-col space-y-12 md:space-y-16 lg:space-y-20 max-w-sm">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-grey-dark dark:text-gray-200">
            Sign In
          </h1>
          <p className="text-grey-medium dark:text-gray-400 mt-2">
            Enter your credentials to access your account
          </p>
        </div>
        <form onSubmit={handleSignIn} className="flex flex-col gap-4 w-full">
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
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              className="w-full rounded-xl border bg-white dark:bg-[#111827] text-grey-dark dark:text-gray-200 border-gray-300 dark:border-[#374151] px-4 py-3 focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all disabled:opacity-50"
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
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              className="w-full rounded-xl border bg-white dark:bg-[#111827] text-grey-dark dark:text-gray-200 border-gray-300 dark:border-[#374151] px-4 py-3 focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all disabled:opacity-50"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white rounded-xl px-4 py-3 font-semibold hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
        {message && (
          <div
            className={`text-center p-4 rounded-xl ${
              message.includes("Error")
                ? "bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800"
                : "bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-800"
            }`}
          >
            {message}
          </div>
        )}
        <div className="text-center">
          <a
            href="/auth/signup"
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Don't have an account? Sign up
          </a>
        </div>
      </div>
    </div>
  );
}
