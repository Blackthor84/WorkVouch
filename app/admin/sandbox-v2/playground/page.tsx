import { redirect } from "next/navigation";
import { getAdminContext } from "@/lib/admin/getAdminContext";
import { SandboxSimulatorBanner } from "@/components/admin/SandboxSimulatorBanner";
import { isSandbox } from "@/lib/app-mode";
import { PlaygroundClient } from "./PlaygroundClient";

export const dynamic = "force-dynamic";

export default async function SandboxPlaygroundPage() {
  const admin = await getAdminContext();
  if (!admin.isAdmin) redirect("/login");

  if (!isSandbox()) {
    return (
      <div className="p-6 max-w-6xl">
        <div className="rounded-lg border border-slate-300 bg-slate-50 px-4 py-6 text-center text-slate-700">
          <p className="font-semibold">Sandbox Playground is not available</p>
          <p className="mt-2 text-sm">
            Playground appears only when <code className="rounded bg-slate-200 px-1">NEXT_PUBLIC_APP_MODE=sandbox</code> and your role is Admin.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl">
      <SandboxSimulatorBanner />
      <div className="mb-6 rounded-lg border-2 border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        <p className="font-semibold">🧪 Sandbox Playground</p>
        <p className="mt-1 text-amber-800">
          You are testing real WorkVouch flows using simulated data. No production users or employers are affected.
        </p>
      </div>
      <h1 className="text-2xl font-semibold text-slate-900 mb-2">Playground</h1>
      <p className="text-slate-600 text-sm mb-6">
        Spawn entities, impersonate them, trigger product flows, and observe hidden systems (read-only).
      </p>
      <PlaygroundClient />
    </div>
  );
}
