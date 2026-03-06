"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShareIcon, ClipboardDocumentIcon, CheckIcon } from "@heroicons/react/24/outline";

export function TeamSharingPanel({ candidateId }: { candidateId: string }) {
  const [copied, setCopied] = useState(false);
  const profileUrl =
    typeof window !== "undefined"
      ? window.location.origin + "/dashboard/employer/candidate/" + candidateId
      : "";

  const copyLink = async () => {
    if (!profileUrl) return;
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1">
        Team sharing
      </h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
        Share this candidate profile with your team via link.
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          readOnly
          value={profileUrl}
          className="flex-1 min-w-0 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-sm text-slate-700 dark:text-slate-300"
        />
        <Button variant="secondary" size="sm" onClick={copyLink} className="inline-flex items-center gap-1">
          {copied ? <CheckIcon className="h-4 w-4" /> : <ClipboardDocumentIcon className="h-4 w-4" />}
          {copied ? "Copied" : "Copy link"}
        </Button>
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
        Team members with access can open this link to view the candidate profile.
      </p>
    </Card>
  );
}
