import { redirect } from "next/navigation";
import { getCurrentUser, isEmployer } from "@/lib/auth";
import { EmployerPortalLayout } from "@/components/employer/EmployerPortalLayout";
import { EmployerSearchClient } from "@/components/employer/EmployerSearchClient";
import { WvPageHeader } from "@/components/wv";

export default async function SearchUsersPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const userIsEmployer = await isEmployer();
  if (!userIsEmployer) {
    redirect("/dashboard");
  }

  return (
    <EmployerPortalLayout wide>
      <WvPageHeader
        eyebrow="Search"
        title="Candidate search"
        description="Find verified candidates by name, role, company, or trust score. Open a profile to review work history and references."
      />
      <div className="mt-8">
        <EmployerSearchClient />
      </div>
    </EmployerPortalLayout>
  );
}
