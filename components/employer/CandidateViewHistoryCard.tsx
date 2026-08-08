"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EyeIcon } from "@heroicons/react/24/outline";
import type { RecentView } from "@/lib/actions/employer/employerDashboardStats";

type Props = {
  recentViews?: RecentView[];
  loading?: boolean;
};

export function CandidateViewHistoryCard({ recentViews = [], loading = false }: Props) {
  return (
    <Card className="p-6">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <EyeIcon className="h-5 w-5 text-grey-medium dark:text-gray-400" />
          <h3 className="text-lg font-semibold text-grey-dark dark:text-gray-200">
            Candidate activity
          </h3>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/employer/candidates">View saved</Link>
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-grey-medium dark:text-gray-400">Loading recent views…</p>
      ) : recentViews.length === 0 ? (
        <>
          <p className="text-sm text-grey-medium dark:text-gray-400">
            No candidate profiles viewed yet. Search verified candidates to start building your pipeline.
          </p>
          <Button variant="secondary" size="sm" className="mt-4" asChild>
            <Link href="/employer/search-users">Search candidates</Link>
          </Button>
        </>
      ) : (
        <ul className="space-y-3">
          {recentViews.map((view) => (
            <li
              key={`${view.candidate_id}-${view.viewed_at}`}
              className="flex items-center justify-between gap-3 text-sm"
            >
              <Link
                href={`/employer/profile/${view.candidate_id}`}
                className="font-medium text-grey-dark hover:underline dark:text-gray-200"
              >
                {view.candidate_name ?? "Candidate"}
              </Link>
              <span className="shrink-0 text-xs text-grey-medium dark:text-gray-500">
                {new Date(view.viewed_at).toLocaleDateString()}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
