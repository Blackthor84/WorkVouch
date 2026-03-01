"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type ContentFlag = {
  id: string;
  content_type: string;
  content_id: string;
  reason: string;
  status: string;
  resolved_at: string | null;
  resolved_by: string | null;
  resolution_action: string | null;
  created_at: string;
};

type ResolveAction = "approve" | "remove" | "escalate";

export function FlaggedContentClient() {
  const [flags, setFlags] = useState<ContentFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const fetchFlags = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/content-flags?status=open", {
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error ?? "Failed to load flags");
      }
      const data = await res.json();
      setFlags((data as { flags: ContentFlag[] }).flags ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load flags");
      setFlags([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFlags();
  }, [fetchFlags]);

  const handleResolve = async (flagId: string, action: ResolveAction) => {
    setResolvingId(flagId);
    try {
      const res = await fetch(`/api/admin/content-flags/${flagId}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action, reason: `Admin ${action}` }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error((data as { error?: string }).error ?? "Resolve failed");
      }
      await fetchFlags();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Resolve failed");
    } finally {
      setResolvingId(null);
    }
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleString(undefined, {
        dateStyle: "short",
        timeStyle: "short",
      });
    } catch {
      return iso;
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-3">
          <div className="h-4 w-1/3 rounded bg-slate-200 dark:bg-slate-700" />
          <div className="h-10 rounded bg-slate-200 dark:bg-slate-700" />
          <div className="h-10 rounded bg-slate-200 dark:bg-slate-700" />
          <div className="h-10 rounded bg-slate-200 dark:bg-slate-700" />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <p className="text-red-600 dark:text-red-400">{error}</p>
        <Button onClick={fetchFlags} variant="outline" className="mt-4">
          Retry
        </Button>
      </Card>
    );
  }

  if (flags.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-slate-600 dark:text-slate-400">No open flags.</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-700">
              <th className="text-left py-3 px-4 font-semibold text-[#0F172A] dark:text-gray-200">
                Type
              </th>
              <th className="text-left py-3 px-4 font-semibold text-[#0F172A] dark:text-gray-200">
                Content ID
              </th>
              <th className="text-left py-3 px-4 font-semibold text-[#0F172A] dark:text-gray-200">
                Reason
              </th>
              <th className="text-left py-3 px-4 font-semibold text-[#0F172A] dark:text-gray-200">
                Flagged at
              </th>
              <th className="text-left py-3 px-4 font-semibold text-[#0F172A] dark:text-gray-200">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {flags.map((flag) => (
              <tr
                key={flag.id}
                className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50"
              >
                <td className="py-3 px-4 text-[#0F172A] dark:text-gray-200 capitalize">
                  {flag.content_type}
                </td>
                <td className="py-3 px-4 text-slate-600 dark:text-slate-400 font-mono text-xs">
                  {flag.content_id}
                </td>
                <td className="py-3 px-4 text-[#0F172A] dark:text-gray-200 max-w-xs truncate">
                  {flag.reason}
                </td>
                <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                  {formatDate(flag.created_at)}
                </td>
                <td className="py-3 px-4">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={resolvingId === flag.id}
                      onClick={() => handleResolve(flag.id, "approve")}
                    >
                      {resolvingId === flag.id ? "…" : "Approve"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={resolvingId === flag.id}
                      onClick={() => handleResolve(flag.id, "remove")}
                    >
                      Remove
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={resolvingId === flag.id}
                      onClick={() => handleResolve(flag.id, "escalate")}
                    >
                      Escalate
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
