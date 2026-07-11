import { redirect } from "next/navigation";
import { getCurrentUser, hasRole } from "@/lib/auth";
import { EmployerPortalLayout } from "@/components/employer/EmployerPortalLayout";
import { EmployerMessages } from "@/components/employer/employer-messages";
import { WvPageHeader } from "@/components/wv";

export default async function EmployerMessagesPage() {
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
        eyebrow="Inbox"
        title="Messages"
        description="Communicate with candidates and manage conversations"
      />
      <div className="mt-8">
        <EmployerMessages />
      </div>
    </EmployerPortalLayout>
  );
}
