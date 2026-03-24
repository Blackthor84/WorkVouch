import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { BriefcaseIcon } from "@heroicons/react/24/outline";

export async function VerifiedJobs({ userId }: { userId: string }) {
  const supabase = await createClient();
  const { data: jobs } = await supabase
    .from("jobs")
    .select("id, company_name, title, start_date, end_date, is_current")
    .eq("user_id", userId)
    .eq("verification_status", "verified")
    .order("start_date", { ascending: false })
    .limit(10);

  const list = (jobs ?? []) as Array<{
    id: string;
    company_name: string;
    title: string;
    start_date: string;
    end_date: string | null;
    is_current: boolean;
  }>;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <BriefcaseIcon className="h-5 w-5" />
          Verified Work History
        </CardTitle>
      </CardHeader>
      <CardContent>
        {list.length === 0 ? (
          <div className="space-y-3">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Get your first verified role on the board
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Add a job, then request vouches from coworker matches—verified work shows up here.
            </p>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/my-jobs"
                className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Manage jobs
              </Link>
              <Link
                href="/coworker-matches"
                className="inline-flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-600 px-3 py-2 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Find coworkers
              </Link>
            </div>
          </div>
        ) : (
          <ul className="space-y-2">
            {list.map((job) => (
              <li key={job.id} className="flex items-center justify-between text-sm">
                <div>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {job.company_name}
                  </span>
                  {job.title && (
                    <span className="text-gray-500 dark:text-gray-400">
                      {" — "}{job.title}
                    </span>
                  )}
                </div>
                <span className="text-gray-400 text-xs">
                  {job.is_current ? "Current" : formatDateRange(job.start_date, job.end_date)}
                </span>
              </li>
            ))}
          </ul>
        )}
        <Link
          href="/my-jobs"
          className="mt-3 inline-block text-sm text-blue-600 hover:underline dark:text-blue-400"
        >
          View all jobs →
        </Link>
      </CardContent>
    </Card>
  );
}

function formatDateRange(start: string, end: string | null): string {
  const s = start.slice(0, 7);
  const e = end ? end.slice(0, 7) : "—";
  return `${s} – ${e}`;
}
