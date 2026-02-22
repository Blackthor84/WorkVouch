"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import {
  ClipboardDocumentIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  PencilSquareIcon,
} from "@heroicons/react/24/outline";

type VisibilityOption = "private" | "verified_employers" | "shared_network" | "public";

interface ProfileVisibility {
  visibility?: string;
  is_public_passport?: boolean;
  searchable_by_verified_employers?: boolean;
  searchable_by_shared_employers?: boolean;
}

export function PublicPassportSettings() {
  const [userId, setUserId] = useState<string | null>(null);
  const [visibility, setVisibility] = useState<VisibilityOption>("private");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/user/me", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((body: { id?: string; user?: { id?: string }; profile?: ProfileVisibility } | null) => {
        if (cancelled || body === null) return;
        const id = body.id ?? body.user?.id;
        if (id) setUserId(id);
        const p = body.profile;
        if (p?.is_public_passport === true) setVisibility("public");
        else if (p?.searchable_by_verified_employers && p?.searchable_by_shared_employers) setVisibility("verified_employers");
        else if (p?.searchable_by_shared_employers) setVisibility("shared_network");
        else setVisibility("private");
      })
      .catch((error) => { console.error("[SYSTEM_FAIL]", error); })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const publicUrl = userId
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/passport/${userId}`
    : "";

  const handleVisibilityChange = async (option: VisibilityOption) => {
    if (!userId) return;
    setSaving(true);
    try {
      const res = await fetch("/api/user/passport-visibility", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visibility: option }),
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setVisibility(option);
      } else {
        console.error(data.error || "Failed to update");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCopyUrl = () => {
    if (!publicUrl) return;
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-grey-dark dark:text-gray-200 mb-4">
          Verified Work Profile Visibility
        </h2>
        <p className="text-sm text-grey-medium dark:text-gray-400">Loading…</p>
      </Card>
    );
  }

  const options: { value: VisibilityOption; label: string; description: string }[] = [
    { value: "private", label: "Private (default)", description: "Not searchable. Only you control who sees your passport." },
    { value: "shared_network", label: "Visible to Shared Network Only", description: "Employers at companies you’ve worked at can see a limited view." },
    { value: "verified_employers", label: "Visible to Verified Employers", description: "Any verified employer can see a limited view when searching." },
    { value: "public", label: "Fully Public Profile", description: "Your Verified Work Profile is visible at your shareable link. Requires Enterprise." },
  ];

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold text-grey-dark dark:text-gray-200 mb-4">
        Verified Work Profile Visibility
      </h2>
      <p className="text-sm text-grey-medium dark:text-gray-400 mb-4">
        Control who can discover and view your verified employment and credentials. All accounts are private by default.
      </p>

      <div className="space-y-3">
        {options.map((opt) => (
          <label
            key={opt.value}
            className="flex items-start gap-3 rounded-lg border border-slate-200 dark:border-slate-700 p-4 cursor-pointer has-[:checked]:ring-2 has-[:checked]:ring-blue-500 has-[:checked]:border-blue-500"
          >
            <input
              type="radio"
              name="passport-visibility"
              value={opt.value}
              checked={visibility === opt.value}
              onChange={() => handleVisibilityChange(opt.value)}
              disabled={saving}
              className="mt-1 h-4 w-4 text-blue-600"
            />
            <div>
              <p className="font-medium text-slate-800 dark:text-slate-200">{opt.label}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">{opt.description}</p>
            </div>
          </label>
        ))}
      </div>

      {userId && (
        <>
          <div className="mt-6 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
            <p className="font-medium text-slate-800 dark:text-slate-200 mb-2">Shareable link</p>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                readOnly
                value={publicUrl}
                className="flex-1 min-w-0 rounded border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
              />
              <Button
                variant="secondary"
                size="sm"
                onClick={handleCopyUrl}
                className="inline-flex items-center gap-1.5"
              >
                <ClipboardDocumentIcon className="h-4 w-4" />
                {copied ? "Copied" : "Copy URL"}
              </Button>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" asChild className="inline-flex items-center gap-1.5">
              <a href={publicUrl} target="_blank" rel="noopener noreferrer">
                <EyeIcon className="h-4 w-4" />
                Preview employer view
              </a>
            </Button>
            <Button variant="ghost" size="sm" asChild className="inline-flex items-center gap-1.5">
              <Link href="/help">
                <PencilSquareIcon className="h-4 w-4" />
                Request correction
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled
              className="inline-flex items-center gap-1.5"
              title="Coming soon"
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              Download PDF (coming soon)
            </Button>
          </div>
        </>
      )}
    </Card>
  );
}
