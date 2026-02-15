import { redirect } from "next/navigation";
import { getAdminContext } from "@/lib/admin/getAdminContext";
import { SandboxSimulatorBanner } from "@/components/admin/SandboxSimulatorBanner";
import { ReplaysClient } from "./ReplaysClient";

export const dynamic = "force-dynamic";

/**
 * Admin Sandbox Replays. Read-only replay of events; timeline, before/after trust scores, rule version.
 */
export default async function SandboxReplaysPage() {
  const admin = await getAdminContext();
  if (!admin.isAdmin) redirect("/login");
  return (
    <div className="p-8 max-w-5xl">
      <SandboxSimulatorBanner />
      <h1 className="text-2xl font-semibold text-slate-900 mb-2">Sandbox Replays</h1>
      <p className="text-sm text-slate-600 mb-6">
        Snapshot sandbox state and replay sequences step-by-step. Replay is read-only and does not mutate sandbox data.
      </p>
      <ReplaysClient />
    </div>
  );
}
