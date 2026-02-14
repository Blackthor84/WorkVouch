import { redirect } from "next/navigation";
import { getAdminContext } from "@/lib/admin/getAdminContext";
import { getSandboxContext } from "@/lib/sandbox/sandboxContext";
import { SandboxToggle } from "@/components/admin/SandboxToggle";
import { IS_SANDBOX } from "@/lib/env";

export default async function AdminHomePage() {
  const ctx = await getAdminContext();

  if (!ctx.authorized) {
    redirect("/login");
  }

  const sandbox = await getSandboxContext(ctx.role);

  return (
    <div className="p-8 space-y-6">
      {sandbox.isSuperAdmin && (
        <div className="mb-6 border border-amber-200 p-4 rounded-lg bg-amber-50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-amber-900">Sandbox Mode</h3>
              <p className="text-sm text-amber-800">
                Sandbox is {sandbox.enabled ? "ENABLED" : "DISABLED"}
              </p>
            </div>
            <SandboxToggle enabled={sandbox.enabled} />
          </div>
        </div>
      )}

      <h1 className="text-2xl font-semibold">Admin Dashboard</h1>

      <section>
        <h2 className="font-medium mb-2">Admin Tools</h2>
        <ul className="list-disc ml-6 space-y-1">
          <li><a href="/admin/organizations">Organizations</a></li>
          <li><a href="/admin/employer-usage">Employer Usage</a></li>
          <li><a href="/admin/locations">Locations</a></li>
        </ul>
      </section>

      <section>
        <h2 className="font-medium mb-2">Monitoring</h2>
        <ul className="list-disc ml-6 space-y-1">
          <li><a href="/admin/abuse">Abuse Signals</a></li>
          <li><a href="/admin/scale-metrics">Scale Metrics</a></li>
        </ul>
      </section>

      {ctx.isSuperAdmin && (
        <section>
          <h2 className="font-medium mb-2">Superadmin</h2>
          <ul className="list-disc ml-6 space-y-1">
            <li><a href="/admin/impersonate">Impersonate</a></li>
            <li><a href="/admin/sandbox">Sandbox</a></li>
            <li><a href="/admin/enterprise-load-simulation">Enterprise Simulator</a></li>
          </ul>
        </section>
      )}

      {IS_SANDBOX && ctx.isSuperAdmin && (
        <section className="mt-6 p-4 rounded-lg border border-emerald-200 bg-emerald-50">
          <h2 className="font-medium mb-2 text-emerald-900">Sandbox-only tools</h2>
          <ul className="list-disc ml-6 space-y-1 text-emerald-800">
            <li><a href="/superadmin/impersonate" className="hover:underline">Impersonate User</a></li>
            <li><a href="/admin/sandbox-v2" className="hover:underline">Seed Fake Activity / Sandbox V2</a></li>
            <li><a href="/admin/sandbox-v2" className="hover:underline">Reset Sandbox Data</a></li>
          </ul>
        </section>
      )}
    </div>
  );
}
