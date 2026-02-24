"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { supabaseBrowser } from "@/lib/supabase/browser";

export default function LoginClient() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError("");
    setLoading(true);
    try {
      const { data: signInData, error: signInError } = await supabaseBrowser.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (signInError) throw signInError;
      const role = String((signInData?.session?.user as { app_metadata?: { role?: string } } | undefined)?.app_metadata?.role ?? "").trim().toLowerCase();
      if (role === "admin" || role === "superadmin") {
        router.push("/admin");
        return;
      }
      router.push("/dashboard");
    } catch (err) {
      if (err instanceof Error && err.message.toLowerCase().includes("email not confirmed")) {
        setError("Please confirm your email before logging in.");
      } else {
        setError("Invalid email or password.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 px-4 overflow-x-hidden">
      <Link href="/" className="mb-6">
        <Image src="/images/workvouch-logo.png.png" alt="WorkVouch" width={180} height={48} className="h-10 w-auto object-contain" priority style={{ objectFit: "contain" }} />
      </Link>
      <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg w-full max-w-md border border-gray-200 dark:border-gray-700">
        <h1 className="text-3xl font-bold mb-2 text-center text-gray-900 dark:text-white">Log in</h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm text-center mb-6">Use your WorkVouch account.</p>
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(e); }} className="space-y-4">
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" required autoComplete="email" />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" required autoComplete="current-password" />
          <p className="text-sm text-gray-600 dark:text-gray-400 -mt-1">
            <Link href="/forgot-password" className="text-blue-600 dark:text-blue-400 hover:underline">Forgot password?</Link>
          </p>
          {error && <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm border border-red-200 dark:border-red-800">{error}</div>}
          <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? "Signing in..." : "Log in"}
          </button>
        </form>
        <p className="text-center mt-6 text-sm text-gray-600 dark:text-gray-400">
          Don&apos;t have an account? <Link href="/signup" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
