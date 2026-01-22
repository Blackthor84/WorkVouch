import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase/server";
import { NavbarServer } from "@/components/navbar-server";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { JobList } from "@/components/workvouch/job-list";
import { AddJobButton } from "@/components/workvouch/add-job-button";
import { BriefcaseIcon } from "@heroicons/react/24/outline";

// Ensure runtime rendering - prevents build-time prerendering
export const revalidate = 0;
export const dynamic = "force-dynamic";

export default async function MyJobsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/signin");
  }

  const supabase = await createServerClient();

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
        job_title: job.job_title ?? "",
      }))
    : [];

  return (
    <>
      <NavbarServer />
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
            <p className="text-grey-medium dark:text-gray-400 mb-4">
              You haven't added any jobs yet.
            </p>
            <AddJobButton />
          </Card>
        )}
      </main>
    </>
  );
}
