import { Suspense } from "react";
import { JobSuccessClient } from "./JobSuccessClient";

export default async function JobSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; company?: string; job_id?: string; returnTo?: string }>;
}) {
  const params = await searchParams;
  const sent = Math.max(0, parseInt(params.sent ?? "0", 10));
  const company = params.company?.trim() ?? "";
  const jobId = params.job_id?.trim() ?? "";
  const returnTo = params.returnTo?.trim() === "onboarding" ? "onboarding" : null;

  return (
    <Suspense fallback={<div className="p-8 text-center">Loading…</div>}>
      <JobSuccessClient sent={sent} company={company} jobId={jobId} returnTo={returnTo} />
    </Suspense>
  );
}
