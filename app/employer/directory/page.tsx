import { redirect } from "next/navigation";
import { getCurrentUser, hasRole } from "@/lib/auth";
import { EmployerDirectoryClient } from "./EmployerDirectoryClient";
import { EmployerPortalLayout } from "@/components/employer/EmployerPortalLayout";
import { WvPageHeader } from "@/components/wv";

export const dynamic = "force-dynamic";

export default async function EmployerDirectoryPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const isEmployer = await hasRole("employer");
  if (!isEmployer) redirect("/dashboard");

  return (
    <EmployerPortalLayout wide>
      <WvPageHeader
        eyebrow="Directory"
        title="Workforce Directory"
        description="Full search with filters. Plan-based limits apply."
      />
      <div className="mt-8">
        <EmployerDirectoryClient />
      </div>
    </EmployerPortalLayout>
  );
}
