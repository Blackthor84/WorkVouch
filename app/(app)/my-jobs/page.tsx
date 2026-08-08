import { redirect } from "next/navigation";
import { Briefcase } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { JobList } from "@/components/workvouch/job-list";
import { AddJobButton } from "@/components/workvouch/add-job-button";
import {
  WvContainer,
  WvPageHeader,
  WvEmptyState,
  WvErrorState,
  WvButton,
} from "@/components/wv";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export default async function MyJobsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const supabaseAny = supabase as any;
  const { data: jobs, error } = await supabaseAny
    .from("jobs")
    .select("*")
    .eq("user_id", user.id)
    .order("start_date", { ascending: false });

  const safeJobs = jobs
    ? jobs.map((job: any) => ({
        ...job,
        company_name: job.company_name ?? "",
        job_title:
          (job as { title?: string; job_title?: string }).title ??
          (job as { title?: string; job_title?: string }).job_title ??
          "",
      }))
    : [];

  return (
    <WvContainer className="py-8">
      <WvPageHeader
        eyebrow="Employment"
        title="My Job History"
        description="Manage your work history and verification status."
        action={<AddJobButton />}
      />

      {error ? (
        <WvErrorState message="We couldn't load your jobs. Please refresh and try again." />
      ) : safeJobs.length > 0 ? (
        <JobList jobs={safeJobs} />
      ) : (
        <WvEmptyState
          icon={<Briefcase className="h-6 w-6" />}
          title="Add your work history to unlock coworker matches"
          description="Roles with accurate dates power overlap matching—then you can request your first vouch."
          action={
            <div className="flex flex-wrap justify-center gap-3">
              <AddJobButton />
              <WvButton href="/coworker-matches" variant="outline" size="sm">
                See coworker matches
              </WvButton>
            </div>
          }
        />
      )}
    </WvContainer>
  );
}
