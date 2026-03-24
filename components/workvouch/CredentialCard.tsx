"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShareIcon, ClipboardDocumentIcon, CheckIcon } from "@heroicons/react/24/outline";
import { CredentialQRCode } from "./CredentialQRCode";

type CredentialStatus = "none" | "active" | "expired";

export function CredentialCard() {
  const [loading, setLoading] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<CredentialStatus>("none");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/user/workvouch-credential", { credentials: "include" })
      .then((res) => res.json().catch(() => ({})))
      .then((data: { credentials?: Array<{ share_token?: string; expires_at?: string }>; error?: string }) => {
        if (cancelled) return;
        const list = data.credentials ?? [];
        const cred = list.find((c) => c.share_token);
        if (cred?.share_token) {
          setShareToken(cred.share_token);
          const base = typeof window !== "undefined" ? window.location.origin : "";
          setShareUrl(`${base}/credential/${encodeURIComponent(cred.share_token)}`);
          if (cred.expires_at && new Date(cred.expires_at) < new Date()) {
            setStatus("expired");
          } else {
            setStatus("active");
          }
        } else {
          setStatus("none");
        }
      })
      .catch(() => {
        if (!cancelled) setStatus("none");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const createAndGetLink = async () => {
    setLoading(true);
    setError(null);
    setShareUrl(null);
    setShareToken(null);
    try {
      const res = await fetch("/api/credential/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ expiresInDays: 30, visibility: "standard" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data as { error?: string }).error ?? "Failed to create credential");
        setLoading(false);
        return;
      }
      const token = (data as { share_token?: string }).share_token;
      if (!token) {
        setError("No share link was generated");
        setLoading(false);
        return;
      }
      const base = typeof window !== "undefined" ? window.location.origin : "";
      const url = `${base}/credential/${encodeURIComponent(token)}`;
      setShareToken(token);
      setShareUrl(url);
      setStatus("active");
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Could not copy");
    }
  };

  const statusLabel =
    status === "active"
      ? "Active"
      : status === "expired"
        ? "Expired"
        : "No credential";

  return (
    <Card>
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1">
        WorkVouch Credential
      </h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
        Verified, read-only employment and trust summary. Share via link or QR.
      </p>

      <div className="flex flex-col sm:flex-row gap-4 items-start">
        {shareUrl && status === "active" && (
          <CredentialQRCode shareUrl={shareUrl} size={160} className="shrink-0" />
        )}
        <div className="flex-1 min-w-0 space-y-3">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Status: {statusLabel}
          </p>
          {!shareUrl ? (
            <Button
              onClick={createAndGetLink}
              disabled={loading}
              className="inline-flex items-center gap-2"
            >
              <ShareIcon className="h-5 w-5" />
              {loading ? "Creating…" : "Create & share credential"}
            </Button>
          ) : status === "expired" ? (
            <Button onClick={createAndGetLink} disabled={loading} variant="secondary">
              Regenerate link
            </Button>
          ) : (
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className="flex-1 min-w-0 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
                />
                <Button variant="secondary" size="sm" onClick={copyToClipboard}>
                  {copied ? <CheckIcon className="h-4 w-4" /> : <ClipboardDocumentIcon className="h-4 w-4" />}
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>
              <Button variant="ghost" size="sm" onClick={() => { setShareUrl(null); setShareToken(null); setError(null); setStatus("none"); }}>
                Create new link
              </Button>
            </div>
          )}
        </div>
      </div>
      {error && (
        <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </Card>
  );
}
