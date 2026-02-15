"use client";

/**
 * Optional casual environment traits. Never framed as rating/scoring.
 * Shown after vouch, match confirm, or job verification. Internal use only.
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  JOB_ENVIRONMENT_TRAIT_LABELS,
  JOB_ENVIRONMENT_TRAIT_KEYS,
  MAX_TRAITS_PER_VOTE,
} from "@/lib/culture/constants";

type Props = {
  jobId: string;
  onDone?: () => void;
  skipLabel?: string;
};

export function EnvironmentVoteForm({ jobId, onDone, skipLabel = "Skip" }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState<"idle" | "submitting" | "done">("idle");

  const toggle = (key: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else if (next.size < MAX_TRAITS_PER_VOTE) next.add(key);
      return next;
    });
  };

  const submit = async () => {
    if (selected.size === 0) {
      onDone?.();
      return;
    }
    setStatus("submitting");
    try {
      const res = await fetch("/api/culture/environment-vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ job_id: jobId, trait_keys: Array.from(selected) }),
      });
      if (res.ok) setStatus("done");
    } catch {
      setStatus("idle");
    }
    onDone?.();
  };

  if (status === "done") return null;

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
      <p className="text-slate-700 mb-3">
        Which of these best describe the work environment? (Pick up to {MAX_TRAITS_PER_VOTE})
      </p>
      <div className="flex flex-wrap gap-2 mb-4">
        {JOB_ENVIRONMENT_TRAIT_KEYS.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => toggle(key)}
            className={`rounded-full px-3 py-1.5 text-xs border transition-colors ${
              selected.has(key)
                ? "bg-blue-100 border-blue-300 text-blue-800"
                : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
            }`}
          >
            {JOB_ENVIRONMENT_TRAIT_LABELS[key]}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <Button type="button" size="sm" onClick={submit} disabled={status === "submitting"}>
          {status === "submitting" ? "Saving…" : "Submit"}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => { onDone?.(); }}>
          {skipLabel}
        </Button>
      </div>
    </div>
  );
}
