import { redirect } from "next/navigation";
import { getCurrentUser, isEmployer } from "@/lib/auth";
import { EmployerPortalLayout } from "@/components/employer/EmployerPortalLayout";
import { UserSearchForm } from "@/components/employer/user-search-form";
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
    <EmployerPortalLayout>
      <WvPageHeader
        eyebrow="Search"
        title="Search Users"
        description="Search for users by name to view their profiles, skills, and work history"
      />
      <div className="mt-8">
        <UserSearchForm />
      </div>
    </EmployerPortalLayout>
  );
}
