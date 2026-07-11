import { redirect } from "next/navigation";
import { getCurrentUser, hasRole } from "@/lib/auth";
import { EmployerPortalLayout } from "@/components/employer/EmployerPortalLayout";
import { EmployerBilling } from "@/components/employer/employer-billing";
import { WvPageHeader } from "@/components/wv";

export default async function EmployerBillingPage() {
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
        eyebrow="Subscription"
        title="Billing & Subscription"
        description="Manage your subscription and billing information"
      />
      <div className="mt-8">
        <EmployerBilling />
      </div>
    </EmployerPortalLayout>
  );
}
