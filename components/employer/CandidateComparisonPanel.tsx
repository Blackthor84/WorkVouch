"use client";

import { Card } from "@/components/ui/card";
import Link from "next/link";
import { ChartBarIcon } from "@heroicons/react/24/outline";

export function CandidateComparisonPanel({ candidateId }: { candidateId: string }) {
  const href = "/dashboard/employer/comparison?candidateId=" + encodeURIComponent(candidateId);
  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1">Candidate comparison</h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Compare this candidate with others side by side.</p>
      <Link href={href} className="inline-flex items-center gap-2 rounded-lg bg-slate-100 dark:bg-slate-800 px-4 py-2 text-sm font-medium text-slate-900 dark:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-700">
        <ChartBarIcon className="h-5 w-5" />
        Open comparison tool
      </Link>
    </Card>
  );
}
