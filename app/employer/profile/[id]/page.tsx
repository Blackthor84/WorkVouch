import { redirect } from "next/navigation";
import { getCurrentUser, hasRole } from "@/lib/auth";
import { getCandidateProfileForEmployer } from "@/lib/actions/employer/candidate-search";
import { getPublicProfile } from "@/lib/actions/employer";
import { EMPLOYER_DISCLAIMER_NOT_ACCEPTED } from "@/lib/employer/requireEmployerLegalAcceptance";
import { EmployerHeader } from "@/components/employer/employer-header";
import { EmployerSidebar } from "@/components/employer/employer-sidebar";
import { CandidateProfileViewer } from "@/components/employer/candidate-profile-viewer";
import { PublicProfileView } from "@/components/public-profile-view";
import { EmployerLegalDisclaimerGate } from "@/components/employer/EmployerLegalDisclaimerGate";

export default async function EmployerCandidateProfilePage(props: {
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

    return (
      <div className="flex min-h-screen bg-background dark:bg-[#0D1117]">
        <EmployerSidebar />
        <div className="flex-1 flex flex-col">
          <EmployerHeader />
          <main className="flex-1 p-6">
            <div className="max-w-7xl mx-auto">
              <CandidateProfileViewer candidateData={candidateData} />
            </div>
          </main>
        </div>
      </div>
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "";
    if (message === EMPLOYER_DISCLAIMER_NOT_ACCEPTED) {
      return (
        <div className="flex min-h-screen bg-background dark:bg-[#0D1117]">
          <EmployerSidebar />
          <div className="flex-1 flex flex-col">
            <EmployerHeader />
            <main className="flex-1 p-6 flex items-center justify-center">
              <EmployerLegalDisclaimerGate
                redirectPath={`/employer/profile/${id}`}
              />
            </main>
          </div>
        </div>
      );
    }
    // Fallback to public profile view
    try {
      const profileData = await getPublicProfile(id);

      return (
        <div className="flex min-h-screen bg-background dark:bg-[#0D1117]">
          <EmployerSidebar />
          <div className="flex-1 flex flex-col">
            <EmployerHeader />
            <main className="flex-1 p-6">
              <div className="max-w-7xl mx-auto">
                <PublicProfileView profileData={profileData} />
              </div>
            </main>
          </div>
        </div>
      );
    } catch (fallbackError: unknown) {
      return (
        <div className="flex min-h-screen bg-background dark:bg-[#0D1117]">
          <EmployerSidebar />
          <div className="flex-1 flex flex-col">
            <EmployerHeader />
            <main className="flex-1 p-6">
              <div className="max-w-7xl mx-auto text-center">
                <h1 className="text-2xl font-bold text-grey-dark dark:text-gray-200 mb-2">
                  Profile Not Found
                </h1>
                <p className="text-grey-medium dark:text-gray-400">
                  This profile could not be loaded.
                </p>
              </div>
            </main>
          </div>
        </div>
      );
    }
  }
}
