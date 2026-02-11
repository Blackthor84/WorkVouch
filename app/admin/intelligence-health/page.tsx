import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { getCurrentUserProfile, getCurrentUserRoles } from "@/lib/auth";
import { isAdmin } from "@/lib/roles";
import { AdminIntelligenceHealthClient } from "./AdminIntelligenceHealthClient";

export const dynamic = "force-dynamic";

export default async function AdminIntelligenceHealthPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const profile = await getCurrentUserProfile();
  const roles = await getCurrentUserRoles();
  const role = profile?.role ?? roles[0] ?? null;
  if (!isAdmin(role) && !roles.some((r) => isAdmin(r))) redirect("/dashboard");

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-white mb-2">Integrity Health Dashboard</h1>
      <p className="text-slate-300 mb-6">
        Monitoring: % profiles recalculated successfully, fraud blocks per day,
        average sentiment shift, overlap validation failures.
      </p>
      <AdminIntelligenceHealthClient />
    </div>
  );
}
