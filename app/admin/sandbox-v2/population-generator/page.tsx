import { redirect } from "next/navigation";
import { getAdminContext } from "@/lib/admin/getAdminContext";
import { SandboxSimulatorBanner } from "@/components/admin/SandboxSimulatorBanner";
import { PopulationGeneratorClient } from "./PopulationGeneratorClient";

export const dynamic = "force-dynamic";

export default async function PopulationGeneratorPage() {
  const admin = await getAdminContext();
  if (!admin.isAdmin) redirect("/login");
  return (
    <div className="p-8 max-w-5xl">
      <SandboxSimulatorBanner />
      <h1 className="text-2xl font-semibold text-slate-900 mb-2">Population Generator</h1>
      <p className="text-sm text-slate-600 mb-6">
        Generate synthetic users and employers. Data never leaves sandbox.
      </p>
      <PopulationGeneratorClient />
    </div>
  );
}
