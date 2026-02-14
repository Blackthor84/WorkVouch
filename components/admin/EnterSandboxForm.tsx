"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const CONFIRMATION_WORD = "SANDBOX";

/**
 * Requires typing SANDBOX to enter sandbox. Prevents accidental activation.
 */
export function EnterSandboxForm() {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const valid = value.trim().toUpperCase() === CONFIRMATION_WORD;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!valid) {
      setError(`Type ${CONFIRMATION_WORD} exactly to continue.`);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/sandbox/toggle", { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.error ?? "Failed to enter sandbox");
        setLoading(false);
        return;
      }
      router.refresh();
      window.location.href = "/admin";
    } catch {
      setError("Network error");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Type SANDBOX"
        className="w-full rounded border border-amber-300 bg-white px-3 py-2 text-amber-900 placeholder-amber-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
        autoComplete="off"
        aria-label="Confirmation: type SANDBOX to enter sandbox"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={!valid || loading}
        className="w-full rounded-lg bg-amber-600 px-4 py-2 font-semibold text-white hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Entering…" : "Enter Sandbox Mode"}
      </button>
    </form>
  );
}
