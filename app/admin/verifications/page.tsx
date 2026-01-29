import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-config";
import { VerificationsList } from "@/components/workvouch/verifications-list";

export default async function AdminVerificationsPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "admin") {
    redirect("/auth/signin");
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 bg-background dark:bg-[#0D1117] min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-grey-dark dark:text-gray-200 mb-2">
          Verification Requests
        </h1>
        <p className="text-grey-medium dark:text-gray-400">
          Review and approve verification requests
        </p>
      </div>
      <VerificationsList />
    </main>
  );
}
