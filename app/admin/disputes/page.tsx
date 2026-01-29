import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { DisputesList } from "@/components/workvouch/disputes-list";

export default async function AdminDisputesPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) redirect("/auth/signin");
  const roles = session.user.roles || [];
  if (!roles.includes("admin") && !roles.includes("superadmin")) redirect("/dashboard");

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 bg-background dark:bg-[#0D1117] min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-grey-dark dark:text-gray-200 mb-2">
          Disputes Queue
        </h1>
        <p className="text-grey-medium dark:text-gray-400">
          Review and resolve employer disputes
        </p>
      </div>
      <DisputesList />
    </main>
  );
}
