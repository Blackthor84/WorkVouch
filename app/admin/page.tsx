import { redirect } from "next/navigation";
import { getAdminContext } from "@/lib/admin/getAdminContext";
import { getSandboxContext } from "@/lib/sandbox/sandboxContext";
import { SandboxToggle } from "@/components/admin/SandboxToggle";
import { APP_MODE } from "@/lib/app-mode";

export default async function AdminHomePage() {
  const admin = await getAdminContext();

  if (!admin.isAdmin) {
    redirect("/login");
  }

  const sandbox = await getSandboxContext(admin.isSuperAdmin ? "super_admin" : "admin");

  return (
    <div className="p-8 space-y-6">
      {APP_MODE === "sandbox" && (
        <div className="mb-6 border border-amber-400 bg-amber-100 p-4 rounded-lg">
          <p className="font-semibold text-amber-900">SANDBOX MODE</p>
          <p className="text-sm text-amber-800">Sandbox is strictly more powerful than production: create/delete orgs, reset state, inject demo activity, simulate references, disputes, fast-forward timelines, force feature flags. No production data is affected.</p>
        </div>
      )}
      {admin.isSuperAdmin && (
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

      <section className="rounded-lg border border-slate-200 bg-slate-50 p-4 mb-6">
        <h2 className="font-medium mb-2 text-slate-900">What you can do here</h2>
        <p className="text-sm text-slate-700 mb-2">
          This panel is for WorkVouch admins and super admins. You can view organizations, users, usage, audit logs, and (as super admin) impersonate users, override limits, and manage sandbox/demo data. All actions are logged.
        </p>
        <p className="text-sm text-slate-600">
          <strong>Sandbox vs Production:</strong> In sandbox mode the app runs with elevated powers: plan limits are ignored, you can seed and reset demo data, and use clone-org/simulate-enterprise APIs. Production never shows demo data and enforces plan limits.
        </p>
        <p className="text-sm text-slate-600 mt-1">
          <strong>Destructive actions</strong> (e.g. hard delete user, reset org, bulk suspend) are available only where indicated and require super admin in production; in sandbox they are available for testing. Always confirm before running.
        </p>
        {admin.canImpersonate && (
          <p className="text-sm text-amber-800 mt-2 font-medium">
            Impersonation is enabled for your role. When impersonating, you act as another user; exit via the admin bar to return to your account. Impersonation is audited.
          </p>
        )}
      </section>

      <section>
        <h2 className="font-medium mb-2">Admin Tools</h2>
        <ul className="list-disc ml-6 space-y-1">
          <li><a href="/admin/users" className="hover:underline">User search (email, name, org)</a></li>
          <li><a href="/admin/organizations" className="hover:underline">Org search & management</a></li>
          <li><a href="/admin/employer-usage" className="hover:underline">Employer Usage</a></li>
          <li><a href="/admin/locations" className="hover:underline">Locations</a></li>
          <li><a href="/admin/feature-flags" className="hover:underline">Feature flags (per org)</a></li>
          <li><a href="/admin/audit-logs" className="hover:underline">Audit logs (read-only)</a></li>
          {process.env.NEXT_PUBLIC_ORG_HEALTH_PLACEHOLDER_VISIBLE === "true" && (
            <li><a href="/admin/org-health" className="hover:underline">Org health (placeholder)</a></li>
          )}
        </ul>
      </section>

      <section>
        <h2 className="font-medium mb-2">Monitoring</h2>
        <ul className="list-disc ml-6 space-y-1">
          <li><a href="/admin/abuse">Abuse Signals</a></li>
          <li><a href="/admin/scale-metrics">Scale Metrics</a></li>
        </ul>
      </section>

      <section>
        <h2 className="font-medium mb-2">Store & compliance</h2>
        <ul className="list-disc ml-6 space-y-1">
          <li><a href="/admin/store-readiness">App Store Readiness Checklist</a></li>
          <li><a href="/admin/resumes">Resumes (list by user/org)</a></li>
        </ul>
      </section>

      {admin.isSuperAdmin && (
        <section>
          <h2 className="font-medium mb-2">Superadmin</h2>
          <ul className="list-disc ml-6 space-y-1">
            <li><a href="/admin/impersonate">Impersonate</a></li>
            <li><a href="/admin/sandbox">Sandbox</a></li>
            <li><a href="/admin/enterprise-load-simulation">Enterprise Simulator</a></li>
          </ul>
        </section>
      )}

      {APP_MODE === "sandbox" && admin.isSuperAdmin && (
        <section className="mt-6 p-4 rounded-lg border border-emerald-200 bg-emerald-50">
          <h2 className="font-medium mb-2 text-emerald-900">Sandbox-only tools (more powerful than production)</h2>
          <ul className="list-disc ml-6 space-y-1 text-emerald-800">
            <li><a href="/superadmin/impersonate" className="hover:underline">Impersonate User</a></li>
            <li><a href="/admin/sandbox-v2" className="hover:underline">Seed Fake Activity / Sandbox V2</a></li>
            <li><a href="/admin/sandbox-v2" className="hover:underline">Reset Sandbox Data</a></li>
            <li><a href="/admin/seed-demo-orgs" className="hover:underline">Re-seed demo orgs</a></li>
          </ul>
        </section>
      )}
    </div>
  );
}
