"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { getAppMode } from "@/lib/app-mode";
import { saveEmployee } from "@/lib/data/adapter";
import { INDUSTRIES } from "@/lib/constants/industries";

export default function SignupEmployeePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [industry, setIndustry] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sandboxId, setSandboxId] = useState<string | null>(null);

  useEffect(() => {
    const sandbox = searchParams.get("sandbox") === "true";
    const id = searchParams.get("sandboxId")?.trim() ?? null;
    if (sandbox && id) setSandboxId(id);
    const ind = searchParams.get("industry")?.trim();
    if (ind) setIndustry(ind);
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
      const result = await saveEmployee(
        { sandboxId, industry: industry.trim(), full_name: fullName.trim() || undefined },
        "sandbox"
      );
      if (!result.success) {
        setError(result.error ?? "Signup failed.");
        setLoading(false);
        return;
      }
      router.push(`/admin/sandbox-v2?sandboxId=${encodeURIComponent(sandboxId)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed.");
      setLoading(false);
    }
  }

  if (!isSandbox) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 px-4">
        <p className="text-gray-600 dark:text-gray-400 mb-4">Employee signup in sandbox mode requires a sandbox session.</p>
        <Link href="/admin/sandbox-v2" className="text-blue-600 dark:text-blue-400 underline">Go to Sandbox</Link>
      </div>
    );
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
        <h1 className="text-2xl font-bold mb-2 text-center text-gray-900 dark:text-white">
          Employee signup (sandbox)
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm text-center mb-6">
          Same flow as production, data stored in sandbox. No Stripe, no real auth.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Industry</label>
            <select
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            >
              <option value="">Select</option>
              {INDUSTRIES.map((ind) => (
                <option key={ind} value={ind}>{ind}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full name (optional)</label>
            <input
              type="text"
              placeholder="Full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
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
            {loading ? "Creating…" : "Continue to sandbox"}
          </button>
        </form>
        <p className="text-center mt-6 text-sm text-gray-600 dark:text-gray-400">
          <Link href="/admin/sandbox-v2" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
            ← Back to Sandbox
          </Link>
        </p>
      </div>
    </div>
  );
}
