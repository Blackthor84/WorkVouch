import { redirect } from "next/navigation";
import { isSuperAdmin } from "@/lib/auth";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function EnvironmentSwitcherPage() {
  const superAdmin = await isSuperAdmin();
  if (!superAdmin) redirect("/dashboard");

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Environment Switcher</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Switch between Sandbox and Production. Use ?sandbox=true or cookie app_environment. Same schema and logic; data isolated by environment.
      </p>
      <div className="flex gap-4">
        <a href="/?environment=production" className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-sm">Production</a>
        <a href="/?sandbox=true" className="px-4 py-2 rounded-lg bg-amber-200 dark:bg-amber-800 text-sm">Sandbox</a>
      </div>
      <Link href="/superadmin" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">← Back</Link>
    </div>
  );
}
