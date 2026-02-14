import { getAdminContext } from "@/lib/admin/getAdminContext";
import { redirect } from "next/navigation";
import { EnterSandboxForm } from "@/components/admin/EnterSandboxForm";

export const dynamic = "force-dynamic";

/**
 * Enter Sandbox: requires typing SANDBOX to enter. Same powers as prod; never touches production data.
 */
export default async function EnterSandboxPage() {
  const admin = await getAdminContext();
  if (!admin.isAdmin) redirect("/dashboard");

  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      <div className="rounded-xl border-2 border-amber-400 bg-amber-50 p-6 shadow-sm">
        <h1 className="text-xl font-bold text-amber-900 mb-2">🧪 Enter Sandbox Mode</h1>
        <p className="text-sm text-amber-800 mb-4">
          Sandbox has the <strong>same</strong> powers as production. You can suspend users, promote admins,
          modify trust scores, remove reviews, and test emergency actions. No production data will be affected.
        </p>
        <p className="text-sm text-amber-800 mb-6">
          Type <strong>SANDBOX</strong> below to confirm and enter sandbox mode.
        </p>
        <EnterSandboxForm />
      </div>
    </div>
  );
}
