"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { getAppMode } from "@/lib/app-mode";
import { saveEmployer } from "@/lib/data/adapter";
import { INDUSTRIES } from "@/lib/constants/industries";
import { WvShell, WvCard, WvButton, WvInput } from "@/components/wv";

const selectClass =
  "w-full rounded-xl border border-wv-border bg-wv-surface px-4 py-3 text-sm text-wv-foreground transition-colors focus:border-wv-brand-blue/50 focus:outline-none focus:ring-2 focus:ring-wv-brand-blue/30";

export default function SignupEmployerClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [industry, setIndustry] = useState("");
  const [planTier, setPlanTier] = useState("pro");
  const [companyName, setCompanyName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sandboxId, setSandboxId] = useState<string | null>(null);

  useEffect(() => {
    const sandbox = searchParams.get("sandbox") === "true";
    const id = searchParams.get("sandboxId")?.trim() ?? null;
    if (sandbox && id) setSandboxId(id);
    const ind = searchParams.get("industry")?.trim();
    if (ind) setIndustry(ind);
    const tier = searchParams.get("plan_tier")?.trim();
    if (tier) setPlanTier(tier);
  }, [searchParams]);

  const isSandbox = getAppMode() === "sandbox" && !!sandboxId;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!isSandbox || !sandboxId) {
      setError("Sandbox mode requires a sandbox session. Start from the sandbox page.");
      return;
    }
    if (!industry.trim()) {
      setError("Select an industry.");
      return;
    }
    setLoading(true);
    try {
      const result = await saveEmployer(
        { sandboxId, industry: industry.trim(), plan_tier: planTier, company_name: companyName.trim() || undefined },
        "sandbox"
      );
      if (!result.success) {
        setError(result.error ?? "Signup failed.");
        setLoading(false);
        return;
      }
      router.push(`/employer/dashboard?sandbox=true&sandboxId=${encodeURIComponent(sandboxId)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed.");
      setLoading(false);
    }
  }

  if (!isSandbox) {
    return null;
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
          <h1 className="text-2xl font-bold text-center text-wv-foreground">
            Employer signup (sandbox)
          </h1>
          <p className="text-wv-muted text-sm text-center mt-2 mb-6">
            Same flow as production, data stored in sandbox. No Stripe, no real auth.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="employer-industry" className="mb-1.5 block text-sm font-medium text-wv-muted">
                Industry
              </label>
              <select
                id="employer-industry"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className={selectClass}
                required
              >
                <option value="">Select</option>
                {INDUSTRIES.map((ind) => (
                  <option key={ind} value={ind}>{ind}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="employer-plan" className="mb-1.5 block text-sm font-medium text-wv-muted">
                Plan tier
              </label>
              <select
                id="employer-plan"
                value={planTier}
                onChange={(e) => setPlanTier(e.target.value)}
                className={selectClass}
              >
                <option value="starter">Starter</option>
                <option value="pro">Pro</option>
                <option value="team">Team</option>
              </select>
            </div>
            <WvInput
              label="Company name (optional)"
              type="text"
              placeholder="Company name"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
            />
            {error && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}
            <WvButton type="submit" disabled={loading} className="w-full" size="lg">
              {loading ? "Creating…" : "Continue to dashboard"}
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
