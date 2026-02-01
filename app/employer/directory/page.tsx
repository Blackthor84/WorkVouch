import { redirect } from "next/navigation";
import { getCurrentUser, hasRole } from "@/lib/auth";
import { EmployerDirectoryClient } from "./EmployerDirectoryClient";

export const dynamic = "force-dynamic";

export default async function EmployerDirectoryPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/signin");
  const isEmployer = await hasRole("employer");
  if (!isEmployer) redirect("/dashboard");

  return (
    <div className="flex-1 p-6">
      <h1 className="text-2xl font-bold text-grey-dark dark:text-gray-200">
        Workforce Directory
      </h1>
      <p className="mt-1 text-sm text-grey-medium dark:text-gray-400">
        Full search with filters. Plan-based limits apply.
      </p>
      <EmployerDirectoryClient />
    </div>
  );
}
