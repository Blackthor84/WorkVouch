import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import BetaAccessManager from "@/components/admin/BetaAccessManager";
import { AdminBetaGate } from "@/components/AdminBetaGate";

export default async function AdminBetaPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) redirect("/login");
  const roles = session.user.roles || [];
  if (!roles.includes("admin") && !roles.includes("superadmin")) redirect("/dashboard");

  return (
    <AdminBetaGate>
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[#0F172A] mb-2">Beta Access Management</h1>
        <p className="text-[#334155]">Create temporary preview access for beta users</p>
      </div>

      <BetaAccessManager />
    </div>
    </AdminBetaGate>
  );
}
