import { redirect } from "next/navigation";
import { getAdminContext } from "@/lib/admin/getAdminContext";
import { SandboxSimulatorBanner } from "@/components/admin/SandboxSimulatorBanner";
import { RedTeamClient } from "./RedTeamClient";

export const dynamic = "force-dynamic";

export default async function SandboxRedTeamPage() {
  const admin = await getAdminContext();
  if (!admin.isAdmin) redirect("/login");
  return (
    <div className="p-8 max-w-5xl">
      <SandboxSimulatorBanner />
      <h1 className="text-2xl font-semibold text-slate-900 mb-2">Red-Team Mode</h1>
      <p className="text-sm text-slate-600 mb-6">
        Stress the trust system with adversarial scenarios. No real emails or notifications.
      </p>
      <RedTeamClient />
    </div>
  );
}
