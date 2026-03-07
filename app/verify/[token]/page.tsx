"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";

type Invite = {
  id: string;
  company: string | null;
  role: string | null;
  status: string;
  candidateId: string;
  expiresAt: string | null;
};

type Result = "idle" | "confirming" | "denying" | "success" | "error";

export default function VerifyTokenPage() {
  const params = useParams();
  const token = typeof params?.token === "string" ? params.token : "";

  const [invite, setInvite] = useState<Invite | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [result, setResult] = useState<Result>("idle");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!token.trim()) {
      setLoading(false);
      setFetchError("Invalid link");
      return;
    }
    let cancelled = false;
    fetch(`/api/verification/invite/${encodeURIComponent(token)}`, {
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) {
          if (res.status === 404) throw new Error("Invite not found");
          return res.json().then((b) => {
            throw new Error((b as { error?: string }).error ?? "Failed to load");
          });
        }
        return res.json();
      })
      .then((data: Invite) => {
        if (!cancelled) setInvite(data);
      })
      .catch((e) => {
        if (!cancelled) setFetchError(e instanceof Error ? e.message : "Failed to load");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const respond = useCallback(
    async (action: "confirm" | "deny") => {
      if (!token.trim()) return;
      setResult(action === "confirm" ? "confirming" : "denying");
      setMessage(null);
      try {
        const res = await fetch(
          `/api/verification/invite/${encodeURIComponent(token)}/respond`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ action }),
          }
        );
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setMessage((data as { error?: string }).error ?? "Request failed");
          setResult("error");
          return;
        }
        setMessage(
          action === "confirm"
            ? "Thank you for confirming employment."
            : "Your response has been recorded."
        );
        setResult("success");
        setInvite((prev) =>
          prev ? { ...prev, status: action === "confirm" ? "confirmed" : "denied" } : null
        );
      } catch {
        setMessage("Request failed");
        setResult("error");
      }
    },
    [token]
  );

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-6">
        <p className="text-slate-600 dark:text-slate-400">Loading…</p>
      </main>
    );
  }

  if (fetchError || !invite) {
    return (
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-6">
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-8 text-center max-w-md">
          <h1 className="text-xl font-semibold text-slate-900 dark:text-gray-100 mb-2">
            Invalid or expired link
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            {fetchError ?? "This verification link could not be found."}
          </p>
        </div>
      </main>
    );
  }

  if (invite.status !== "pending") {
    return (
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-6">
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-8 text-center max-w-md">
          <h1 className="text-xl font-semibold text-slate-900 dark:text-gray-100 mb-2">
            Already responded
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            You have already responded to this verification request.
          </p>
        </div>
      </main>
    );
  }

  const isExpired =
    invite.expiresAt != null && new Date(invite.expiresAt).getTime() < Date.now();
  if (isExpired) {
    return (
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-6">
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-8 text-center max-w-md">
          <h1 className="text-xl font-semibold text-slate-900 dark:text-gray-100 mb-2">
            Verification link expired
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            This verification link has expired. Please ask for a new one.
          </p>
        </div>
      </main>
    );
  }

  if (result === "success") {
    return (
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-6">
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-8 text-center max-w-md">
          <CheckCircleIcon className="mx-auto h-12 w-12 text-green-500 mb-4" />
          <h1 className="text-xl font-semibold text-slate-900 dark:text-gray-100 mb-2">
            Success
          </h1>
          <p className="text-slate-600 dark:text-slate-400">{message}</p>
        </div>
      </main>
    );
  }

  const company = invite.company?.trim() || "this company";
  const isBusy = result === "confirming" || result === "denying";

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-6">
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-8 max-w-md w-full">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-gray-100 mb-4">
          Coworker verification
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mb-6">
          You were listed as a coworker at {company}.
          {invite.role?.trim() ? ` (${invite.role})` : ""}
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={() => respond("confirm")}
            disabled={isBusy}
            className="inline-flex items-center justify-center gap-2"
          >
            <CheckCircleIcon className="h-5 w-5" />
            Confirm Employment
          </Button>
          <Button
            variant="secondary"
            onClick={() => respond("deny")}
            disabled={isBusy}
            className="inline-flex items-center justify-center gap-2"
          >
            <XCircleIcon className="h-5 w-5" />
            Deny Employment
          </Button>
        </div>

        {result === "error" && message && (
          <p className="mt-4 text-sm text-red-600 dark:text-red-400">{message}</p>
        )}
      </div>
    </main>
  );
}
