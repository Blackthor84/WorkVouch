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
        title="Search candidates"
        description="Find verified professionals by name, role, company, industry, location, and trust score — then open a profile to review employment and references."
      />
      <div className="mt-8">
        <EmployerSearchClient />
      </div>
    </EmployerPortalLayout>
  );
}
