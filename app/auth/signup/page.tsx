"use client"; // ensures this page runs on the client only

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseClient } from "@/lib/supabase/client";

export default function SignUpPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) {
        setMessage(`Error: ${error.message}`);
        setLoading(false);
        return;
      }

      if (data.user) {
        // Check if email confirmation is required
        if (data.session) {
          // User is immediately signed in (email confirmation disabled)
          setMessage("Account created successfully! Redirecting...");
          setTimeout(() => {
            router.push("/dashboard");
            router.refresh();
          }, 500);
        } else {
          // Email confirmation required
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
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 md:py-12 lg:py-16">
      <div className="w-full flex flex-col space-y-12 md:space-y-16 lg:space-y-20 max-w-sm">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-grey-dark dark:text-gray-200">
            Sign Up
          </h1>
          <p className="text-grey-medium dark:text-gray-400 mt-2">
            Create your WorkVouch account to get started
          </p>
        </div>
        <form onSubmit={handleSignUp} className="flex flex-col gap-4 w-full">
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
              placeholder="Enter a password"
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
            className="w-full bg-green-600 text-white rounded-xl px-4 py-3 font-semibold hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Creating account..." : "Sign Up"}
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
            href="/auth/signin"
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Already have an account? Sign in
          </a>
        </div>
      </div>
    </div>
  );
}
