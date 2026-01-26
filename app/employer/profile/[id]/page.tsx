import { redirect } from "next/navigation";
import { getCurrentUser, hasRole } from "@/lib/auth";
import { getCandidateProfileForEmployer } from "@/lib/actions/employer/candidate-search";
import { getPublicProfile } from "@/lib/actions/employer";
import { EmployerHeader } from "@/components/employer/employer-header";
import { EmployerSidebar } from "@/components/employer/employer-sidebar";
import { CandidateProfileViewer } from "@/components/employer/candidate-profile-viewer";
import { PublicProfileView } from "@/components/public-profile-view";

export default async function EmployerCandidateProfilePage(props: any) {
  const { id } = await props.params;
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/signin");
  }

  const isEmployer = await hasRole("employer");

  if (!isEmployer) {
    redirect("/dashboard");
  }

  // Try to get candidate profile first (full employer view)
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
  } catch (error: any) {
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
    } catch (fallbackError: any) {
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
