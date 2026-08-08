import { redirect } from "next/navigation";
import { getCurrentUser, hasRole } from "@/lib/auth";
import { EmployerPortalLayout } from "@/components/employer/EmployerPortalLayout";
import { EmployerNotificationsPanel } from "@/components/employer/EmployerNotificationsPanel";
import { WvPageHeader } from "@/components/wv";

export default async function EmployerNotificationsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const isEmployer = await hasRole("employer");
  if (!isEmployer) redirect("/dashboard");

  return (
    <EmployerPortalLayout>
      <WvPageHeader
        eyebrow="Activity"
        title="Notifications"
        description="Verification updates, listed employees, and hiring activity."
      />
      <div className="mt-8">
        <EmployerNotificationsPanel />
      </div>
    </EmployerPortalLayout>
  );
}
