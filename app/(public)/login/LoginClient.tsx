"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { WvShell, WvCard, WvButton, WvInput } from "@/components/wv";

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
      const role = String(
        (signInData?.user as { app_metadata?: { role?: string } } | undefined)?.app_metadata?.role ?? "",
      ).trim().toLowerCase();
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
    <WvShell>
      <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
        <Link href="/" className="mb-8 flex items-center gap-2.5 rounded-lg" aria-label="WorkVouch home">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 text-sm font-bold text-white shadow-lg">
            WV
          </span>
          <span className="text-lg font-bold text-wv-foreground">WorkVouch</span>
        </Link>

        <WvCard glow className="w-full max-w-md">
          <h1 className="text-2xl font-bold text-center text-wv-foreground">Welcome back</h1>
          <p className="text-wv-muted text-sm text-center mt-2 mb-6">Sign in to your WorkVouch account.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <WvInput
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="you@email.com"
            />
            <WvInput
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="••••••••"
            />
            <p className="text-sm text-wv-muted -mt-1">
              <Link href="/forgot-password" className="text-blue-400 hover:text-blue-300">
                Forgot password?
              </Link>
            </p>
            {error && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}
            <WvButton type="submit" disabled={loading} className="w-full" size="lg">
              {loading ? "Signing in…" : "Sign in"}
            </WvButton>
          </form>

          <p className="text-center mt-6 text-sm text-wv-muted">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-blue-400 hover:text-blue-300 font-medium">
              Sign up
            </Link>
          </p>
        </WvCard>
      </div>
    </WvShell>
  );
}
