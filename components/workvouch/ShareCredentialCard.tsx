"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShareIcon, ClipboardDocumentIcon, CheckIcon } from "@heroicons/react/24/outline";

export function ShareCredentialCard() {
  const [loading, setLoading] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createAndGetLink = async () => {
    setLoading(true);
    setError(null);
    setShareUrl(null);
    try {
      const res = await fetch("/api/user/workvouch-credential", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          includeShareToken: true,
          expiresInDays: 30,
          visibility: "standard",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data as { error?: string }).error ?? "Failed to create link");
        return;
      }
      const token = (data as { share_token?: string }).share_token;
      if (!token) {
        setError("No share link was generated");
        return;
      }
      const base = typeof window !== "undefined" ? window.location.origin : "";
      setShareUrl(`${base}/c/${token}`);
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

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-grey-dark dark:text-gray-200 mb-2">
        WorkVouch Credential
      </h3>
      <p className="text-sm text-grey-medium dark:text-gray-400 mb-4">
        A verified, read-only summary of your employment history and trust signals.
      </p>
      {!shareUrl ? (
        <Button
          onClick={createAndGetLink}
          disabled={loading}
          className="inline-flex items-center gap-2"
        >
          <ShareIcon className="h-5 w-5" />
          {loading ? "Creating link…" : "Share My WorkVouch Credential"}
        </Button>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-grey-medium dark:text-gray-400">
            Link expires in 30 days. Share with employers or add to applications.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="flex-1 min-w-0 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-grey-dark dark:text-gray-200"
            />
            <Button
              variant="secondary"
              size="sm"
              onClick={copyToClipboard}
              className="inline-flex items-center gap-1"
            >
              {copied ? <CheckIcon className="h-4 w-4" /> : <ClipboardDocumentIcon className="h-4 w-4" />}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
          <Button variant="ghost" size="sm" onClick={() => { setShareUrl(null); setError(null); }}>
            Create another link
          </Button>
        </div>
      )}
      {error && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </Card>
  );
}
