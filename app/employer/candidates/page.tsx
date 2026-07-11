import { redirect } from "next/navigation";
import { getCurrentUser, hasRole } from "@/lib/auth";
import { EmployerPortalLayout } from "@/components/employer/EmployerPortalLayout";
import { CandidateSearch } from "@/components/employer/candidate-search";
import { ProfileCompleteBanner } from "@/components/employer/ProfileCompleteBanner";
import { WvPageHeader, WvButton } from "@/components/wv";

export default async function EmployerCandidatesPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const isEmployer = await hasRole("employer");

  if (!isEmployer) {
    redirect("/dashboard");
  }

  return (
    <EmployerPortalLayout wide>
      <WvPageHeader
        eyebrow="Talent"
        title="Candidate Search"
        description="Find qualified professionals in law enforcement, security, hospitality, retail, and warehousing"
        action={
          <WvButton href="/employer/search-users" variant="secondary" size="sm">
            Search by Name
          </WvButton>
        }
      />
      <ProfileCompleteBanner feature="Candidate search" />
      <div className="mt-8">
        <CandidateSearch />
      </div>
    </EmployerPortalLayout>
  );
}
