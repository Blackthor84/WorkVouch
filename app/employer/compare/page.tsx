import { redirect } from "next/navigation";
import { getCurrentUser, isEmployer } from "@/lib/auth";
import { EmployerHeader } from "@/components/employer/employer-header";
import { CompareViewClient } from "./CompareViewClient";

export default async function ComparePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const userIsEmployer = await isEmployer();
  if (!userIsEmployer) redirect("/dashboard");

  return (
    <>
      <EmployerHeader />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 bg-background dark:bg-[#0D1117] min-h-screen">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-grey-dark dark:text-gray-200 mb-2">
            Compare candidates
          </h1>
          <p className="text-grey-medium dark:text-gray-400">
            Side-by-side view of verification, trust band, references, and flags. No raw scores are shown.
          </p>
        </div>
        <CompareViewClient />
      </main>
    </>
  );
}
