import { redirect } from "next/navigation";
import { getCurrentUser, hasRole } from "@/lib/auth";
import { getCandidateProfileForEmployer } from "@/lib/actions/employer/candidate-search";
import { EMPLOYER_DISCLAIMER_NOT_ACCEPTED } from "@/lib/employer/requireEmployerLegalAcceptance";
import { EmployerPortalLayout } from "@/components/employer/EmployerPortalLayout";
import { CandidateProfileViewer } from "@/components/employer/candidate-profile-viewer";
import { EmployerLegalDisclaimerGate } from "@/components/employer/EmployerLegalDisclaimerGate";

export default async function CandidateProfilePage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const isEmployer = await hasRole("employer");

  if (!isEmployer) {
    redirect("/dashboard");
  }

  let candidateData;
  try {
    candidateData = await getCandidateProfileForEmployer(id);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "";
    if (message === EMPLOYER_DISCLAIMER_NOT_ACCEPTED) {
      return (
        <EmployerPortalLayout>
          <EmployerLegalDisclaimerGate redirectPath={`/employer/candidates/${id}`} />
        </EmployerPortalLayout>
      );
    }
    return (
      <EmployerPortalLayout>
        <div className="text-center py-16">
          <h1 className="text-2xl font-bold text-wv-foreground mb-2">Candidate Not Found</h1>
          <p className="text-wv-muted">{message || "This candidate profile could not be loaded."}</p>
        </div>
      </EmployerPortalLayout>
    );
  }

  return (
    <EmployerPortalLayout wide>
      <CandidateProfileViewer
        candidateData={candidateData}
        hiringDataUnlocked={candidateData.hiringDataUnlocked}
      />
    </EmployerPortalLayout>
  );
}
