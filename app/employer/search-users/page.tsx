import { redirect } from "next/navigation";
import { getCurrentUser, isEmployer } from "@/lib/auth";
import { EmployerHeader } from "@/components/employer/employer-header";
import { UserSearchForm } from "@/components/employer/user-search-form";

export default async function SearchUsersPage() {
  const user = await getCurrentUser();

  if (!user) {
    console.log("REDIRECT TRIGGERED IN: app/employer/search-users/page.tsx");
    redirect("/login");
  }

  const userIsEmployer = await isEmployer();
  if (!userIsEmployer) {
    redirect("/dashboard");
  }

  return (
    <>
      <EmployerHeader />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 bg-background dark:bg-[#0D1117] min-h-screen">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-grey-dark dark:text-gray-200 mb-2">
            Search Users
          </h1>
          <p className="text-grey-medium dark:text-gray-400">
            Search for users by name to view their profiles, skills, and work
            history
          </p>
        </div>

        <UserSearchForm />
      </main>
    </>
  );
}
