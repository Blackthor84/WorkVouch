import { redirect } from "next/navigation";
import { getCurrentUser, hasRole } from "@/lib/auth";
import { getCandidateReport } from "@/lib/actions/employer-purchases";
import { CandidateReportView } from "@/components/candidate-report-view";
import { EmployerPortalLayout } from "@/components/employer/EmployerPortalLayout";
import { WvCard, WvButton } from "@/components/wv";

export default async function CandidateReportPage(props: {
  params: Promise<{ candidateId: string }>;
}) {
  const { candidateId } = await props.params;
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const isEmployer = await hasRole("employer");

  if (!isEmployer) {
    redirect("/dashboard");
  }

  let report;
  try {
    report = await getCandidateReport(candidateId);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "You do not have access to this report.";
    return (
      <EmployerPortalLayout>
        <WvCard glow className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold text-wv-foreground mb-4">Access Denied</h1>
          <p className="text-wv-muted mb-6">{message}</p>
          <WvButton href={`/employer/search?candidateId=${candidateId}`}>
            Purchase Report
          </WvButton>
        </WvCard>
      </EmployerPortalLayout>
    );
  }

  return (
    <EmployerPortalLayout wide>
      <CandidateReportView report={report} />
    </EmployerPortalLayout>
  );
}
