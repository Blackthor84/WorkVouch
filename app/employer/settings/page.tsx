import { redirect } from "next/navigation";
import { getCurrentUser, hasRole } from "@/lib/auth";
import { EmployerPortalLayout } from "@/components/employer/EmployerPortalLayout";
import { CompanyProfileSettings } from "@/components/employer/company-profile-settings";
import { WvPageHeader } from "@/components/wv";

export default async function EmployerSettingsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const isEmployer = await hasRole("employer");

  if (!isEmployer) {
    redirect("/dashboard");
  }

  return (
    <EmployerPortalLayout>
      <WvPageHeader
        eyebrow="Company"
        title="Company Settings"
        description="Manage your company profile and preferences"
      />
      <div className="mt-8">
        <CompanyProfileSettings />
      </div>
    </EmployerPortalLayout>
  );
}
