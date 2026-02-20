import { redirect } from "next/navigation";
import Link from "next/link";
import { getAdminContext } from "@/lib/admin/getAdminContext";
import { Button } from "@/components/ui/button";
import { AdminPlaygroundClient } from "@/components/admin/AdminPlaygroundClient";
import { ImpersonationBanner } from "@/app/sandbox/playground/ImpersonationBanner";
import { SandboxPlaygroundPanels } from "@/app/sandbox/playground/SandboxPlaygroundPanels";
import { FuzzerRunCard } from "./FuzzerRunCard";
import { TrustCurveVisualizer } from "./TrustCurveVisualizer";

export const dynamic = "force-dynamic";

/** Unified Playground: simulation selection, safe/real mode, impersonation, scenario execution. Admin-only. */
export default async function AdminPlaygroundPage() {
  const admin = await getAdminContext();
  if (!admin.isAdmin) redirect("/dashboard");

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <ImpersonationBanner />

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Playground</h1>
          <p className="text-slate-600 mt-1">
            Run simulations in a safe context. Simulation ID, mode, and impersonation are internal—no separate &quot;Sandbox&quot; destination.
          </p>
        </div>
        <Link
          href="/admin/playground/monitor"
          className="inline-flex items-center rounded-lg border border-violet-300 bg-violet-50 px-4 py-2 text-sm font-medium text-violet-800 hover:bg-violet-100"
        >
          Activity Monitor
        </Link>
      </div>

      <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-900">
        <strong>Safety:</strong> Safe mode prevents irreversible actions. Real mode requires explicit admin confirmation when running scenarios. Impersonation is admin-only and auto-expires.
      </div>

      <AdminPlaygroundClient isAdmin={admin.isAdmin} />

      <div className="mt-8">
        <SandboxPlaygroundPanels />
      </div>

      <div className="mt-8 border-t border-slate-200 pt-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-3">Scenario Fuzzer & Trust Curve</h2>
        <p className="text-slate-600 text-sm mb-4">
          Fuzzer generates valid DSL (boost rings, retaliation, oscillation, impersonation spam), randomizes actors and steps, runs via the real runner, and logs to the system audit. Trust Curve shows per-step reputation and overlays abuse/rate-limit events; replay from any step.
        </p>
        <div className="space-y-6">
          <FuzzerRunCard />
          <TrustCurveVisualizer />
        </div>
      </div>

      <div className="mt-8 border-t border-slate-200 pt-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-3">Advanced simulation tools</h2>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/sandbox-v2/replays"><Button variant="outline" size="sm">Replays</Button></Link>
          <Link href="/admin/sandbox-v2/population-generator"><Button variant="outline" size="sm">Population Generator</Button></Link>
          <Link href="/admin/sandbox-v2/redteam"><Button variant="outline" size="sm">Red-Team</Button></Link>
          <Link href="/admin/sandbox-v2/playbook"><Button variant="outline" size="sm">Stress-Test Playbook</Button></Link>
          <Link href="/admin/sandbox-v2/rule-versions"><Button variant="outline" size="sm">Rule Versions</Button></Link>
        </div>
      </div>
    </div>
  );
}
