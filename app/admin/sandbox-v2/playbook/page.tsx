import { redirect } from "next/navigation";
import { getAdminContext } from "@/lib/admin/getAdminContext";
import { SandboxSimulatorBanner } from "@/components/admin/SandboxSimulatorBanner";
import { PlaybookClient } from "./PlaybookClient";

export const dynamic = "force-dynamic";

export default async function SandboxPlaybookPage() {
  const admin = await getAdminContext();
  if (!admin.isAdmin) redirect("/login");
  return (
    <div className="p-8 max-w-5xl">
      <SandboxSimulatorBanner />
      <h1 className="text-2xl font-semibold text-slate-900 mb-2">Fraud Stress-Test Playbook</h1>
      <p className="text-sm text-slate-600 mb-6">
        Run automated stress tests. Reports are exportable.
      </p>
      <PlaybookClient />
    </div>
  );
}
