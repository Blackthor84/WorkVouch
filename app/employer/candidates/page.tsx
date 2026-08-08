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
        title="Saved candidates"
        description="Profiles you saved from search. Open one to review or send a message."
        action={
          <WvButton href="/employer/search-users" variant="secondary" size="sm">
            Search
          </WvButton>
        }
      />
      <div className="mt-8">
        <SavedCandidates />
      </div>
    </EmployerPortalLayout>
  );
}
