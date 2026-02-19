"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type Ref = {
  id: string;
  from_user_id: string;
  to_user_id: string;
  rating?: number | null;
  is_hidden?: boolean;
  created_at: string;
};

export function AdminReviewsClient() {
  const [refs, setRefs] = useState<Ref[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    fetch("/api/admin/references")
      .then((r) => r.json())
      .then((data) => setRefs(data?.references ?? []))
      .catch(() => setRefs([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const hide = async (referenceId: string) => {
    setActionId(referenceId);
    try {
      const res = await fetch("/api/admin/references/hide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference_id: referenceId }),
      });
      if (res.ok) load();
      else alert((await res.json().catch(() => ({})))?.error ?? "Failed");
    } finally {
      setActionId(null);
    }
  };

  const recalc = async (userId: string) => {
    setActionId(userId);
    try {
      const res = await fetch("/api/admin/reputation/recalc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId }),
      });
      if (res.ok) load();
      else alert((await res.json().catch(() => ({})))?.error ?? "Failed");
    } finally {
      setActionId(null);
    }
  };

  if (loading && refs.length === 0) {
    return <div className="rounded-xl border border-slate-200 bg-white p-8"><p className="text-slate-500">Loading references…</p></div>;
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">From → To</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Rating</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Hidden</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Created</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {refs.map((r) => (
              <tr key={r.id} className={r.is_hidden ? "bg-slate-100" : ""}>
                <td className="px-4 py-3 text-sm text-slate-700">{r.from_user_id?.slice(0, 8)}… → {r.to_user_id?.slice(0, 8)}…</td>
                <td className="px-4 py-3 text-sm">{r.rating ?? "—"}</td>
                <td className="px-4 py-3 text-sm">{r.is_hidden ? "Yes" : "No"}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{new Date(r.created_at).toLocaleString()}</td>
                <td className="px-4 py-3 text-right space-x-2">
                  {!r.is_hidden && (
                    <Button variant="outline" size="sm" disabled={actionId !== null} onClick={() => hide(r.id)}>
                      {actionId === r.id ? "…" : "Hide"}
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" disabled={actionId !== null} onClick={() => recalc(r.to_user_id)}>
                    {actionId === r.to_user_id ? "…" : "Recalc"}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
