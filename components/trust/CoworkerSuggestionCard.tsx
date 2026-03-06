"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserCircleIcon } from "@heroicons/react/24/outline";

export type CoworkerSuggestion = {
  profileId: string;
  name: string;
  jobTitle: string;
  companyName: string;
  overlapStart: string;
  overlapEnd: string;
};

type Props = {
  coworker: CoworkerSuggestion;
  employmentRecordId: string;
  onRequestVerification: (profileId: string, employmentRecordId: string) => void;
  requesting?: boolean;
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", year: "numeric" });
}

export function CoworkerSuggestionCard({
  coworker,
  employmentRecordId,
  onRequestVerification,
  requesting = false,
}: Props) {
  return (
    <Card className="p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex items-start gap-2 min-w-0">
          <div className="flex-shrink-0 rounded-full bg-slate-100 dark:bg-slate-800 p-1.5">
            <UserCircleIcon className="h-5 w-5 text-slate-500 dark:text-slate-400" />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-slate-900 dark:text-slate-100 truncate">{coworker.name}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{coworker.jobTitle}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              {coworker.companyName} · Overlap: {formatDate(coworker.overlapStart)} – {formatDate(coworker.overlapEnd)}
            </p>
          </div>
        </div>
        <Button
          size="sm"
          variant="secondary"
          disabled={requesting}
          onClick={() => onRequestVerification(coworker.profileId, employmentRecordId)}
        >
          {requesting ? "Sending…" : "Request verification"}
        </Button>
      </div>
    </Card>
  );
}
