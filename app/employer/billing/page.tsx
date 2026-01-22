import { redirect } from "next/navigation";
import { getCurrentUser, hasRole } from "@/lib/auth";
import { EmployerHeader } from "@/components/employer/employer-header";
import { EmployerSidebar } from "@/components/employer/employer-sidebar";
import { EmployerBilling } from "@/components/employer/employer-billing";

export default async function EmployerBillingPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/signin");
  }

  const isEmployer = await hasRole("employer");

  if (!isEmployer) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen bg-background dark:bg-[#0D1117]">
      <EmployerSidebar />
      <div className="flex-1 flex flex-col">
        <EmployerHeader />
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-grey-dark dark:text-gray-200">
                Billing & Subscription
              </h1>
              <p className="text-grey-medium dark:text-gray-400 mt-1">
                Manage your subscription and billing information
              </p>
            </div>
            <EmployerBilling />
          </div>
        </main>
      </div>
    </div>
  );
}
