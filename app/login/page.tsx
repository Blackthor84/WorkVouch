"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (signInError) {
      setError("Invalid email or password. Please try again.");
      setLoading(false);
      return;
    }

    if (!data.user) {
      setError("Login failed. Please try again.");
      setLoading(false);
      return;
    }

    // Role-based redirect: check user_roles and employer_accounts
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", data.user.id);
    const { data: employerRow } = await supabase.from("employer_accounts").select("id").eq("user_id", data.user.id).maybeSingle();
    const roleList = (roles ?? []).map((r: { role: string }) => r.role);
    if (employerRow && !roleList.includes("employer")) roleList.push("employer");

    if (roleList.includes("admin") || roleList.includes("superadmin")) {
      router.push("/admin");
    } else if (roleList.includes("employer")) {
      router.push("/employer/dashboard");
    } else {
      router.push("/dashboard");
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 px-4">
      <Link href="/" className="mb-6">
        <Image
          src="/images/workvouch-logo.png.png"
          alt="WorkVouch"
          width={180}
          height={48}
          className="h-10 w-auto object-contain"
          priority
          style={{ objectFit: "contain" }}
        />
      </Link>
      <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg w-full max-w-md border border-gray-200 dark:border-gray-700">
        <h1 className="text-3xl font-bold mb-2 text-center text-gray-900 dark:text-white">Log in</h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm text-center mb-6">Use your WorkVouch account.</p>
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
            autoComplete="email"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
            autoComplete="current-password"
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
            {loading ? "Signing in..." : "Log in"}
          </button>
        </form>
        <p className="text-center mt-6 text-sm text-gray-600 dark:text-gray-400">
          Don&apos;t have an account?{" "}
          <Link href="/auth/signup" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
