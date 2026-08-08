import { redirect } from "next/navigation";
import { getCurrentUser, hasRole } from "@/lib/auth";
import { getCandidateProfileForEmployer } from "@/lib/actions/employer/candidate-search";
import { EMPLOYER_DISCLAIMER_NOT_ACCEPTED } from "@/lib/employer/requireEmployerLegalAcceptance";
import { EmployerPortalLayout } from "@/components/employer/EmployerPortalLayout";
import { CandidateProfileViewer } from "@/components/employer/candidate-profile-viewer";
import { EmployerLegalDisclaimerGate } from "@/components/employer/EmployerLegalDisclaimerGate";
import { WvErrorState } from "@/components/wv";

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
      <EmployerPortalLayout wide>
        <WvErrorState
          title="Candidate not found"
          message={message || "This profile could not be loaded. They may have removed public access or the link is incorrect."}
        />
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
