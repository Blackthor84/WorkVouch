import { redirect } from "next/navigation";
import { getAdminContext } from "@/lib/admin/getAdminContext";
import { DisputesList } from "@/components/workvouch/disputes-list";

export default async function AdminDisputesPage() {
  const admin = await getAdminContext();
  if (!admin.isAdmin) redirect("/login");

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[#0F172A] mb-2">Disputes Queue</h1>
        <p className="text-[#334155]">Review and resolve employer disputes</p>
      </div>
      <DisputesList />
    </main>
  );
}
