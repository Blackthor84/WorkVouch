import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { JobList } from "@/components/workvouch/job-list";
import { AddJobButton } from "@/components/workvouch/add-job-button";
import { BriefcaseIcon } from "@heroicons/react/24/outline";

// Ensure runtime rendering - prevents build-time prerendering
export const revalidate = 0;
export const dynamic = "force-dynamic";

export default async function MyJobsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const supabaseAny = supabase as any;
  const { data: jobs, error } = await supabaseAny
    .from("jobs")
    .select("*")
    .eq("user_id", user.id)
    .order("start_date", { ascending: false });

  // Normalize jobs: convert string | null to string
  const safeJobs = jobs
    ? jobs.map((job: any) => ({
        ...job,
        company_name: job.company_name ?? "",
        job_title: (job as { title?: string; job_title?: string }).title ?? (job as { title?: string; job_title?: string }).job_title ?? "",
      }))
    : [];

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 bg-background dark:bg-[#0D1117] min-h-screen">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-grey-dark dark:text-gray-200 mb-2">
              My Job History
            </h1>
            <p className="text-grey-medium dark:text-gray-400">
              Manage your work history and verification status
            </p>
          </div>
          <AddJobButton />
        </div>

        {error ? (
          <Card className="p-8 text-center">
            <p className="text-red-600 dark:text-red-400">Error loading jobs</p>
          </Card>
        ) : safeJobs && safeJobs.length > 0 ? (
          <JobList jobs={safeJobs} />
        ) : (
          <Card className="p-12 text-center">
            <BriefcaseIcon className="h-12 w-12 text-grey-medium dark:text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-semibold text-grey-dark dark:text-gray-200 mb-2">
              Add your work history to unlock coworker matches
            </p>
            <p className="text-grey-medium dark:text-gray-400 mb-6 text-sm max-w-md mx-auto">
              Roles with accurate dates power overlap matching—then you can request your first vouch.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <AddJobButton />
              <Link
                href="/coworker-matches"
                className="inline-flex items-center justify-center rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-2 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
              >
                See coworker matches
              </Link>
            </div>
          </Card>
        )}
    </main>
  );
}
