"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log("[LOGIN] Submit fired");
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email: email.trim().toLowerCase(),
      password,
      redirect: false,
    });

    console.log("[LOGIN] Result:", JSON.stringify(result, null, 2));

    if (!result) {
      console.error("[LOGIN] No result returned");
      setError("Login failed. Try again.");
      setLoading(false);
      return;
    }

    if (result.error) {
      console.error("[LOGIN] Error:", result.error);
      setError("Invalid email or password");
      setLoading(false);
      return;
    }

    if (result.ok) {
      console.log("[LOGIN] Success. Checking session...");

      const sessionCheck = await fetch("/api/auth/session");
      const sessionData = await sessionCheck.json();

      console.log("[LOGIN] Session:", sessionData);

      if (sessionData?.user) {
        router.push("/dashboard");
        router.refresh();
      } else {
        console.error("[LOGIN] Session not established");
        setError("Login succeeded but session failed.");
      }
    }

    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 px-4 overflow-x-hidden">
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
          <Link href="/signup" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center" />}>
      <LoginForm />
    </Suspense>
  );
}
