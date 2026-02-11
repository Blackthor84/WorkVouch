"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type HistoryEntry = {
  id: string;
  previous_email: string;
  new_email: string;
  changed_by: string;
  created_at: string;
};

export function ChangeEmailSettings() {
  const searchParams = useSearchParams();
  const [newEmail, setNewEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/account/email-change-history")
      .then((res) => res.json())
      .then((data: unknown) => {
        if (!cancelled && Array.isArray(data)) setHistory(data as HistoryEntry[]);
      })
      .catch((err: unknown) => {
        if (!cancelled) setHistory([]);
        console.error("[ChangeEmailSettings] email-change-history", { err });
      })
      .finally(() => {
        if (!cancelled) setHistoryLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const confirmToken = searchParams.get("confirm-email-change");
    const revokeToken = searchParams.get("revoke-email-change");
    if (!confirmToken && !revokeToken) return;

    if (confirmToken) {
      setMessage({ type: "success", text: "Confirming email change..." });
      (async () => {
        try {
          const r = await fetch("/api/account/confirm-email-change", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token: confirmToken }),
          });
          const data = (await r.json().catch(() => ({}))) as { success?: boolean; error?: string };
          if (data.success) {
            setMessage({ type: "success", text: "Email changed successfully. You can sign in with your new email." });
            setHistoryLoading(true);
            try {
              const histRes = await fetch("/api/account/email-change-history");
              const d = (await histRes.json().catch(() => null)) as unknown;
              if (Array.isArray(d)) setHistory(d as HistoryEntry[]);
            } finally {
              setHistoryLoading(false);
            }
            if (typeof window !== "undefined") window.history.replaceState({}, "", window.location.pathname);
          } else {
            setMessage({ type: "error", text: data.error ?? "Confirmation failed." });
          }
        } catch (err: unknown) {
          console.error("[ChangeEmailSettings] confirm-email-change", { err });
          setMessage({ type: "error", text: "Confirmation failed." });
        }
      })();
      return;
    }

    if (revokeToken) {
      setMessage({ type: "success", text: "Revoking..." });
      (async () => {
        try {
          const r = await fetch("/api/account/revoke-email-change", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token: revokeToken }),
          });
          const data = (await r.json().catch(() => ({}))) as { success?: boolean; error?: string };
          if (data.success) {
            setMessage({ type: "success", text: "Email change request revoked." });
            if (typeof window !== "undefined") window.history.replaceState({}, "", window.location.pathname);
          } else {
            setMessage({ type: "error", text: data.error ?? "Revoke failed." });
          }
        } catch (err: unknown) {
          console.error("[ChangeEmailSettings] revoke-email-change", { err });
          setMessage({ type: "error", text: "Revoke failed." });
        }
      })();
    }
  }, [searchParams.toString()]);

  const handleSendVerification = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    const email = newEmail.trim().toLowerCase();
    if (!email) {
      setMessage({ type: "error", text: "Enter a new email address." });
      return;
    }
    setMessage(null);
    setLoading(true);
    try {
      const res = await fetch("/api/account/request-email-change", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ new_email: email }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setMessage({ type: "error", text: data.error ?? "Request failed." });
        return;
      }
      setMessage({
        type: "success",
        text: "We sent a confirmation link to your new email. Your current email remains active until confirmed.",
      });
      setNewEmail("");
    } catch (err: unknown) {
      console.error("[ChangeEmailSettings] request-email-change", { err });
      setMessage({ type: "error", text: "An error occurred." });
    } finally {
      setLoading(false);
    }
  }, [loading, newEmail]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Change Email</CardTitle>
        <p className="text-sm text-grey-medium dark:text-gray-400 mt-1">
          Use a two-step verification flow. Your current email stays active until you confirm the new one.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {message && (
          <div
            className={`rounded-lg p-3 text-sm ${
              message.type === "success"
                ? "bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200"
                : "bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200"
            }`}
          >
            {message.text}
          </div>
        )}
        <form onSubmit={handleSendVerification} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-grey-dark dark:text-gray-300 mb-1">New email address</label>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-lg border border-grey-background dark:border-[#374151] bg-white dark:bg-[#111827] px-3 py-2 text-grey-dark dark:text-gray-200"
            />
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? "Sending..." : "Send Verification"}
          </Button>
        </form>

        <div>
          <h3 className="text-sm font-semibold text-grey-dark dark:text-gray-200 mb-2">Email Change History</h3>
          {historyLoading ? (
            <p className="text-sm text-grey-medium dark:text-gray-400">Loading...</p>
          ) : history.length === 0 ? (
            <p className="text-sm text-grey-medium dark:text-gray-400">No email changes yet.</p>
          ) : (
            <ul className="space-y-2">
              {history.map((entry) => (
                <li
                  key={entry.id}
                  className="text-sm text-grey-dark dark:text-gray-200 border border-grey-background dark:border-[#374151] rounded-lg p-3"
                >
                  <span className="text-grey-medium dark:text-gray-400">{entry.previous_email}</span>
                  <span className="mx-2">→</span>
                  <span>{entry.new_email}</span>
                  <span className="ml-2 text-grey-medium dark:text-gray-400">
                    ({entry.changed_by}) · {new Date(entry.created_at).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
