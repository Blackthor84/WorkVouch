"use client";

import Link from "next/link";
import { TrustScoreBadge } from "./TrustScoreBadge";
import { cn } from "@/lib/utils";

export type CandidateCardData = {
  id: string;
  full_name: string | null;
  trust_score: number;
  jobs: Array<{ company_name: string; job_title: string | null; start_date: string; end_date: string | null }>;
};

export function CandidateCard({ candidate, className }: { candidate: CandidateCardData; className?: string }) {
  const name = candidate.full_name ?? "Candidate";
  const latestJob = candidate.jobs[0];
  const company = latestJob?.company_name ?? "—";

  return (
    <article
      className={cn(
        "rounded-2xl border border-slate-200/80 bg-white p-6 shadow-md transition hover:shadow-lg",
        className
      )}
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{name}</h3>
            <p className="text-sm text-gray-500 mt-0.5">{company}</p>
          </div>
          <TrustScoreBadge score={candidate.trust_score} size="lg" />
        </div>
        <Link
          href={`/candidate/${candidate.id}`}
          className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 transition-colors"
        >
          View Profile
        </Link>
      </div>
    </article>
  );
}
