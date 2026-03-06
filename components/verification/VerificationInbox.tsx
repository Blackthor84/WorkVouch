"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EnvelopeIcon, CheckIcon, XMarkIcon } from "@heroicons/react/24/outline";
import type { PendingVerificationRequest } from "@/app/api/verification/pending/route";

export function VerificationInbox() {
  const [requests, setRequests] = useState<PendingVerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [respondingId, setRespondingId] = useState<string | null>(null);

  const fetchPending = () => {
    setLoading(true);
    setError(null);
    fetch("/api/verification/pending", { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load");
        return res.json();
      })
      .then((data: { requests?: PendingVerificationRequest[] }) => {
        setRequests(Array.isArray(data.requests) ? data.requests : []);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const respond = async (requestId: string, response: "accept" | "decline") => {
    setRespondingId(requestId);
    try {
      const res = await fetch("/api/verification/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ request_id: requestId, response }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data as { error?: string }).error ?? "Failed to respond");
        return;
      }
      setRequests((prev) => prev.filter((r) => r.id !== requestId));
    } finally {
      setRespondingId(null);
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
          Verification requests
        </h2>
        <p className="text-sm text-slate-500">Loading…</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1">
        Verification requests
      </h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
        Requests from colleagues asking you to verify employment. Accept to confirm you worked together.
      </p>
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 mb-4">{error}</p>
      )}
      {requests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <EnvelopeIcon className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-2" />
          <p className="text-sm text-slate-500 dark:text-slate-400">
            No pending verification requests.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {requests.map((r) => (
            <li
              key={r.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 dark:border-slate-700 p-4"
            >
              <div className="min-w-0">
                <p className="font-medium text-slate-900 dark:text-slate-100">
                  {r.requester_name ?? "Someone"}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {r.company_name ?? ""}
                  {r.job_title ? ` · ${r.job_title}` : ""}
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                  Requested {new Date(r.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={respondingId === r.id}
                  onClick={() => respond(r.id, "decline")}
                >
                  <XMarkIcon className="h-4 w-4 mr-1" />
                  Decline
                </Button>
                <Button
                  size="sm"
                  disabled={respondingId === r.id}
                  onClick={() => respond(r.id, "accept")}
                >
                  {respondingId === r.id ? "..." : (
                    <>
                      <CheckIcon className="h-4 w-4 mr-1" />
                      Accept
                    </>
                  )}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
