import { redirect } from "next/navigation";
import { hasRole } from "@/lib/auth";
import { EmployerPortalLayout } from "@/components/employer/EmployerPortalLayout";
import { EmployerSearchForm } from "@/components/employer-search-form";
import { WvPageHeader } from "@/components/wv";

export default async function EmployerSearchPage() {
  const isEmployer = await hasRole("employer");

  if (!isEmployer) {
    redirect("/dashboard");
  }

  return (
    <EmployerPortalLayout>
      <WvPageHeader
        eyebrow="Search"
        title="Search Candidates"
        description="Find verified professionals by name, role, or location."
      />
      <div className="mt-8">
        <EmployerSearchForm />
      </div>
    </EmployerPortalLayout>
  );
}
