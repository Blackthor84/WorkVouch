"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { error: err } = await supabaseBrowser.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: `${typeof window !== "undefined" ? window.location.origin : ""}/auth/callback`,
      });
      if (err) {
        setError(err.message || "Failed to send reset email");
        return;
      }
      setSent(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center px-4">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg w-full max-w-md border border-gray-200 dark:border-gray-700 text-center">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Check your email</h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
            If an account exists for that email, we sent a password reset link. Check your inbox and spam folder.
          </p>
          <Link href="/login" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
            Back to log in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center px-4">
      <Link href="/" className="mb-6">
        <Image src="/images/workvouch-logo.png.png" alt="WorkVouch" width={180} height={48} className="h-10 w-auto object-contain" priority style={{ objectFit: "contain" }} />
      </Link>
      <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg w-full max-w-md border border-gray-200 dark:border-gray-700">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Reset password</h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">Enter your email and we’ll send you a link to reset your password.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
            autoComplete="email"
          />
          {error && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm border border-red-200 dark:border-red-800">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Sending…" : "Send reset link"}
          </button>
        </form>
        <p className="text-center mt-6 text-sm text-gray-600 dark:text-gray-400">
          <Link href="/login" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
            Back to log in
          </Link>
        </p>
      </div>
    </div>
  );
}
