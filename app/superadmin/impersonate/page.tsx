import { redirect } from "next/navigation";
import { isSuperAdmin } from "@/lib/auth";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ImpersonatePage() {
  const superAdmin = await isSuperAdmin();
  if (!superAdmin) redirect("/dashboard");

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Impersonate User</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Log in as Enterprise Owner, Location Admin, or Employee for demo and debugging. Audit log must record impersonation.
      </p>
      <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <p className="text-gray-600 dark:text-gray-400 text-sm">Wire to session impersonation API. Record action in workforce_audit_logs.</p>
      </div>
      <Link href="/superadmin" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">← Back</Link>
    </div>
  );
}
