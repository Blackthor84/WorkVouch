import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { getCurrentUserProfile, getCurrentUserRoles } from "@/lib/auth";
import { isAdmin } from "@/lib/roles";
import { FraudDashboardClient } from "@/components/admin/fraud-dashboard-client";

export const dynamic = "force-dynamic";

export default async function AdminFraudPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  const profile = await getCurrentUserProfile();
  const roles = await getCurrentUserRoles();
  const role = profile?.role ?? roles[0] ?? null;
  if (!isAdmin(role) && !roles.some((r) => isAdmin(r))) redirect("/dashboard");

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 bg-background dark:bg-[#0D1117] min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-grey-dark dark:text-gray-200 mb-2">
          Fraud Detection Dashboard
        </h1>
        <p className="text-grey-medium dark:text-gray-400">
          Self-review blocks, duplicate reviews, overlap failures, rapid velocity, multi-account, sentiment spikes, rehire manipulation, mass negative patterns. Click a row to open user forensics.
        </p>
      </div>
      <FraudDashboardClient />
    </div>
  );
}
