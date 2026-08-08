import { redirect } from "next/navigation";
import { getCurrentUser, hasRole } from "@/lib/auth";
import { EmployerPortalLayout } from "@/components/employer/EmployerPortalLayout";
import { SavedCandidates } from "@/components/employer/saved-candidates";
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
        title="Saved Candidates"
        description="Candidates you saved from search for quick access and follow-up."
        action={
          <WvButton href="/employer/search-users" variant="secondary" size="sm">
            Search candidates
          </WvButton>
        }
      />
      <div className="mt-8">
        <SavedCandidates />
      </div>
    </EmployerPortalLayout>
  );
}
