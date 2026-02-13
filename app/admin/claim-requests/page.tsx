import { redirect } from "next/navigation";
import { getAdminContext } from "@/lib/admin/getAdminContext";
import { ClaimRequestsClient } from "@/components/admin/ClaimRequestsClient";

export default async function AdminClaimRequestsPage() {
  const ctx = await getAdminContext();
  if (!ctx.authorized) redirect("/login");

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[#0F172A] mb-2">Employer claim requests</h1>
        <p className="text-[#334155]">Approve or reject requests to claim company profiles</p>
      </div>
      <ClaimRequestsClient />
    </main>
  );
}
