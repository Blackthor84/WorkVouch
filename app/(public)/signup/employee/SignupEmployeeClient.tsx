"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { saveEmployee } from "@/lib/data/adapter";
import { INDUSTRIES } from "@/lib/constants/industries";
import { WvShell, WvCard, WvButton, WvInput } from "@/components/wv";

const selectClass =
  "w-full rounded-xl border border-wv-border bg-wv-surface px-4 py-3 text-sm text-wv-foreground transition-colors focus:border-wv-brand-blue/50 focus:outline-none focus:ring-2 focus:ring-wv-brand-blue/30";

/**
 * Admin sandbox lab only — reached via /signup/employee?sandbox=true&sandboxId=… from Playground.
 * Production signup is /signup (server redirect when sandbox params are absent).
 */
export default function SignupEmployeeClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [industry, setIndustry] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sandboxId, setSandboxId] = useState<string | null>(null);

  useEffect(() => {
    const id = searchParams.get("sandboxId")?.trim() ?? null;
    if (id) setSandboxId(id);
    const ind = searchParams.get("industry")?.trim();
    if (ind) setIndustry(ind);
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!sandboxId) {
      setError("Sandbox session required. Start from the admin playground.");
      return;
    }
    if (!industry.trim()) {
      setError("Select an industry.");
      return;
    }
    setLoading(true);
    try {
      const result = await saveEmployee(
        { sandboxId, industry: industry.trim(), full_name: fullName.trim() || undefined },
        "sandbox",
      );
      if (!result.success) {
        setError(result.error ?? "Signup failed.");
        setLoading(false);
        return;
      }
      router.push(`/admin/playground?sandboxId=${encodeURIComponent(sandboxId)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed.");
      setLoading(false);
    }
  }

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
          <p className="mb-4 text-center text-xs font-semibold uppercase tracking-wider text-amber-400/90">
            Admin sandbox lab
          </p>
          <h1 className="text-2xl font-bold text-center text-wv-foreground">Employee signup (sandbox)</h1>
          <p className="text-wv-muted text-sm text-center mt-2 mb-6">
            Internal testing only. Data stored in sandbox — no Stripe, no real auth.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="employee-industry" className="mb-1.5 block text-sm font-medium text-wv-muted">
                Industry
              </label>
              <select
                id="employee-industry"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className={selectClass}
                required
              >
                <option value="">Select</option>
                {INDUSTRIES.map((ind) => (
                  <option key={ind} value={ind}>
                    {ind}
                  </option>
                ))}
              </select>
            </div>
            <WvInput
              label="Full name (optional)"
              type="text"
              placeholder="Full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
            {error && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}
            <WvButton type="submit" disabled={loading} className="w-full" size="lg">
              {loading ? "Creating…" : "Continue to Playground"}
            </WvButton>
          </form>

          <p className="text-center mt-6 text-sm text-wv-muted">
            <Link href="/admin/playground" className="text-blue-400 hover:text-blue-300 font-medium">
              ← Back to Playground
            </Link>
          </p>
        </WvCard>
      </div>
    </WvShell>
  );
}
