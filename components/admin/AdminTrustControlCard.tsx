"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

type Props = {
  userId: string;
  initialScore: number | null;
  calculatedAt: string | null;
};

export function AdminTrustControlCard({ userId, initialScore, calculatedAt }: Props) {
  const router = useRouter();
  const [score, setScore] = useState(initialScore != null ? String(Math.round(initialScore)) : "");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const apply = async () => {
    const n = Number(score);
    if (!reason.trim() || Number.isNaN(n)) {
      setMsg("Enter a numeric score (0–100) and a reason.");
      return;
    }
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/control-center/trust-override", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, score: n, reason: reason.trim() }),
      });
      const json = await res.json().catch(() => ({}));
      if (json?.ok) {
        setMsg("Trust score updated.");
        setReason("");
        router.refresh();
      } else {
        setMsg("Could not update. Try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Trust score</h2>
      <p className="text-sm text-slate-500 mt-1">
        Current:{" "}
        <span className="font-medium text-slate-800">
          {initialScore != null ? Math.round(initialScore) : "—"}
        </span>
        {calculatedAt && (
          <span className="ml-2">· Last calc: {new Date(calculatedAt).toLocaleString()}</span>
        )}
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-xs font-medium text-slate-500">New score (0–100)</label>
          <input
            value={score}
            onChange={(e) => setScore(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            inputMode="numeric"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs font-medium text-slate-500">Reason (required)</label>
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            placeholder="Compliance / dispute resolution / manual correction"
          />
        </div>
      </div>
      {msg && <p className="mt-3 text-sm text-slate-600">{msg}</p>}
      <Button className="mt-4" variant="primary" disabled={loading} onClick={() => apply()}>
        {loading ? "Saving…" : "Apply override"}
      </Button>
      <p className="mt-3 text-xs text-slate-400">
        Ban / fraud flag: use profile actions below or mark user as suspended when available.
      </p>
    </div>
  );
}
