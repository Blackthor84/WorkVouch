import { redirect } from "next/navigation";
import { getCurrentUser, hasRole } from "@/lib/auth";
import { EmployerPortalLayout } from "@/components/employer/EmployerPortalLayout";
import { EmployeeSearch } from "@/components/workvouch/employee-search";
import { WvPageHeader } from "@/components/wv";

export default async function EmployerEmployeesPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const isEmployer = await hasRole("employer");
  const isSuperAdmin = await hasRole("superadmin");

  if (!isEmployer && !isSuperAdmin) {
    redirect("/dashboard");
  }

  return (
    <EmployerPortalLayout>
      <WvPageHeader
        eyebrow="Workforce"
        title="Employee Roster"
        description="Search and view employees who list your company in their work history"
      />
      <div className="mt-8">
        <EmployeeSearch />
      </div>
    </EmployerPortalLayout>
  );
}
