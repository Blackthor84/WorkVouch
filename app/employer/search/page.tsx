import { redirect } from "next/navigation";
import { hasRole } from "@/lib/auth";
import { NavbarServer } from "@/components/navbar-server";
import { EmployerSearchForm } from "@/components/employer-search-form";

export default async function EmployerSearchPage() {
  const isEmployer = await hasRole("employer");

  if (!isEmployer) {
    redirect("/dashboard");
  }

  return (
    <>
      <NavbarServer />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 bg-background dark:bg-[#0D1117] min-h-screen">
        <h1 className="mb-6 text-3xl font-bold text-grey-dark dark:text-gray-200">
          Search Candidates
        </h1>
        <EmployerSearchForm />
      </main>
    </>
  );
}
