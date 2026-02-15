import { redirect } from "next/navigation";
import { getAdminContext } from "@/lib/admin/getAdminContext";
import { SandboxSimulatorBanner } from "@/components/admin/SandboxSimulatorBanner";
import { RuleVersionsClient } from "../RuleVersionsClient";

export const dynamic = "force-dynamic";

/**
 * Admin Sandbox Rule Versions. Immutable rule sets; diff engine; impact summary.
 */
export default async function SandboxRuleVersionsPage() {
  const admin = await getAdminContext();
  if (!admin.isAdmin) redirect("/login");
  return (
    <div className="p-8 max-w-5xl">
      <SandboxSimulatorBanner />
      <h1 className="text-2xl font-semibold text-slate-900 mb-2">Rule Versions</h1>
      <p className="text-sm text-slate-600 mb-6">
        Trust-critical rules are versioned. Compare versions and see impact. Sandbox can run multiple versions in parallel.
      </p>
      <RuleVersionsClient />
    </div>
  );
}
