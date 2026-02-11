import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { EmployerReputationPreviewClient } from "@/components/admin/EmployerReputationPreviewClient";

export default async function AdminEmployerReputationPreviewPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  const roles = session.user.roles || [];
  if (!roles.includes("admin") && !roles.includes("superadmin")) redirect("/dashboard");

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[#0F172A] mb-2">Employer reputation preview</h1>
        <p className="text-[#334155]">
          View reputation breakdown for any employer. Generate a 10-minute synthetic preview for testing.
        </p>
      </div>
      <EmployerReputationPreviewClient />
    </main>
  );
}
