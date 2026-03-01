import { redirect } from "next/navigation";
import { getCurrentUser, hasRole } from "@/lib/auth";
import { getCandidateProfileForEmployer } from "@/lib/actions/employer/candidate-search";
import { EMPLOYER_DISCLAIMER_NOT_ACCEPTED } from "@/lib/employer/requireEmployerLegalAcceptance";
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
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 bg-background dark:bg-[#0D1117] min-h-screen">
          <EmployerLegalDisclaimerGate
            redirectPath={`/employer/candidates/${id}`}
          />
        </main>
      );
    }
    return (
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 bg-background dark:bg-[#0D1117] min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-grey-dark dark:text-gray-200 mb-2">
            Candidate Not Found
          </h1>
          <p className="text-grey-medium dark:text-gray-400">
            {message || "This candidate profile could not be loaded."}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 bg-background dark:bg-[#0D1117] min-h-screen">
      <CandidateProfileViewer candidateData={candidateData} />
    </main>
  );
}
