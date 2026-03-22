"use client";

import { useState } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  monetizationTier: string;
};

export function VerifiedWorkersUnlockModal({ open, onClose, monetizationTier }: Props) {
  const [interval, setInterval] = useState<"monthly" | "yearly">("monthly");
  const [loading, setLoading] = useState<"starter" | "pro" | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const isCustom = monetizationTier === "custom";

  async function checkout(planId: "starter" | "pro") {
    setError(null);
    setLoading(planId);
    try {
      const res = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, billingInterval: interval }),
      });
      const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Checkout failed.");
        return;
      }
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      setError("No checkout URL returned.");
    } catch {
      setError("Network error.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="unlock-modal-title"
    >
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white shadow-xl">
        <div className="border-b border-gray-100 px-5 py-4">
          <h2 id="unlock-modal-title" className="text-lg font-bold text-gray-900">
            Unlock Verified Workers
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            See who is actually trusted by their coworkers and hire with confidence.
          </p>
        </div>

        <div className="px-5 py-4">
          {!isCustom ? (
            <>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Billing</p>
              <div className="mt-2 flex rounded-lg border border-gray-200 p-1">
                <button
                  type="button"
                  onClick={() => setInterval("monthly")}
                  className={`flex-1 rounded-md py-2 text-sm font-semibold transition ${
                    interval === "monthly" ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  onClick={() => setInterval("yearly")}
                  className={`flex-1 rounded-md py-2 text-sm font-semibold transition ${
                    interval === "yearly" ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  Yearly (save ~2 mo)
                </button>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Starter {interval === "yearly" ? "$490/yr" : "$49/mo"} · Pro{" "}
                {interval === "yearly" ? "$1,490/yr" : "$149/mo"}
              </p>
            </>
          ) : (
            <p className="text-sm text-gray-600">
              Your account is on a custom plan. To change coverage or seats, contact us — we&apos;ll tailor
              billing to your team.
            </p>
          )}

          {error ? (
            <p className="mt-3 text-sm text-red-600" role="alert">
              {error}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-2 border-t border-gray-100 px-5 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="order-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 sm:order-1"
          >
            Not now
          </button>
          {!isCustom ? (
            <>
              <button
                type="button"
                disabled={loading !== null}
                onClick={() => void checkout("starter")}
                className="order-1 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-black disabled:opacity-50 sm:order-2"
              >
                {loading === "starter"
                  ? "Redirecting…"
                  : interval === "yearly"
                    ? "Upgrade to Starter ($490/yr)"
                    : "Upgrade to Starter ($49/mo)"}
              </button>
              <button
                type="button"
                disabled={loading !== null}
                onClick={() => void checkout("pro")}
                className="order-1 rounded-xl border-2 border-gray-900 bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 hover:bg-gray-50 disabled:opacity-50 sm:order-3"
              >
                {loading === "pro"
                  ? "Redirecting…"
                  : interval === "yearly"
                    ? "Upgrade to Pro ($1,490/yr)"
                    : "Upgrade to Pro ($149/mo)"}
              </button>
            </>
          ) : (
            <a
              href="/contact"
              className="order-1 inline-flex items-center justify-center rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-black sm:order-2"
            >
              Contact us
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
