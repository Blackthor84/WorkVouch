import { redirect } from "next/navigation";
import { getCurrentUser, hasRole } from "@/lib/auth";
import { EmployerHeader } from "@/components/employer/employer-header";
import { EmployerSidebar } from "@/components/employer/employer-sidebar";
import { CandidateSearch } from "@/components/employer/candidate-search";
import { Button } from "@/components/ui/button";

export default async function EmployerCandidatesPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/signin");
  }

  const isEmployer = await hasRole("employer");

  if (!isEmployer) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen bg-background dark:bg-[#0D1117]">
      <EmployerSidebar />
      <div className="flex-1 flex flex-col">
        <EmployerHeader />
        <main className="flex-1 flex flex-col px-6 py-8 md:py-12 lg:py-16">
          <div className="w-full flex flex-col space-y-12 md:space-y-16 lg:space-y-20 max-w-7xl mx-auto">
            {/* Page Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-grey-dark dark:text-gray-200">
                  Candidate Search
                </h1>
                <p className="text-grey-medium dark:text-gray-400 mt-1">
                  Find qualified professionals in law enforcement, security,
                  hospitality, retail, and warehousing
                </p>
              </div>
              <Button href="/employer/search-users" variant="secondary">
                Search by Name
              </Button>
            </div>
            {/* Candidate Search */}
            <div>
              <CandidateSearch />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
