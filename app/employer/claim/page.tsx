import { redirect } from "next/navigation";
import { getCurrentUser, hasRole } from "@/lib/auth";
import { EmployerPortalLayout } from "@/components/employer/EmployerPortalLayout";
import { ClaimEmployerClient } from "@/components/employer/ClaimEmployerClient";
import { WvPageHeader } from "@/components/wv";

export default async function EmployerClaimPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const isEmployer = await hasRole("employer");
  if (!isEmployer) redirect("/dashboard");

  return (
    <EmployerPortalLayout>
      <WvPageHeader
        eyebrow="Verification"
        title="Claim a company"
        description="Request to become the verified owner of a company profile. An admin will review your request."
      />
      <div className="mt-8 max-w-2xl">
        <ClaimEmployerClient />
      </div>
    </EmployerPortalLayout>
  );
}
