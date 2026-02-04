import { redirect } from "next/navigation";
import { getCurrentUser, hasRole } from "@/lib/auth";
import { EmployerHeader } from "@/components/employer/employer-header";
import { EmployerSidebar } from "@/components/employer/employer-sidebar";
import { ClaimEmployerClient } from "@/components/employer/ClaimEmployerClient";

export default async function EmployerClaimPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const isEmployer = await hasRole("employer");
  if (!isEmployer) redirect("/dashboard");

  return (
    <div className="flex min-h-screen bg-background dark:bg-[#0D1117]">
      <EmployerSidebar />
      <div className="flex-1 flex flex-col">
        <EmployerHeader />
        <main className="flex-1 p-6">
          <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold text-grey-dark dark:text-gray-200 mb-2">Claim a company</h1>
            <p className="text-grey-medium dark:text-gray-400 mb-6">
              Request to become the verified owner of a company profile. An admin will review your request.
            </p>
            <ClaimEmployerClient />
          </div>
        </main>
      </div>
    </div>
  );
}
