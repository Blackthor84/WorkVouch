import { getAdminContext } from "@/lib/admin/getAdminContext";
import { isPlatformAdmin, isPlatformReadOnlyAdmin, getAdminRole } from "@/lib/admin";
import { recordFailedAdminAccess } from "@/lib/admin/adminAlertsStore";
import { hasPermission, canMutate, AdminRole, Permission } from "@/lib/permissions";
import { getImpersonationContext } from "@/lib/admin-impersonation";
import { getSandboxContext } from "@/lib/sandbox/sandboxContext";
import { SandboxToggle } from "@/components/admin/SandboxToggle";
import { AdminActivityDashboard } from "@/components/admin/AdminActivityDashboard";
import { hasFeature, AdminFeature } from "@/lib/featureFlags";
import { APP_MODE } from "@/lib/app-mode";
import Link from "next/link";

export default async function AdminHomePage() {
  const admin = await getAdminContext();

  if (!admin.isAuthenticated || !admin.email) {
    recordFailedAdminAccess(undefined);
    return <div className="p-8 text-slate-700">Not authorized</div>;
  }

  const platformAdmin = await isPlatformAdmin(admin.email);
  const readOnly = isPlatformReadOnlyAdmin(admin.email);
  if (!platformAdmin && !readOnly) {
    recordFailedAdminAccess(admin.email);
    return <div className="p-8 text-slate-700">Not authorized</div>;
  }

  const role = await getAdminRole(admin.email);
  const canEdit = role != null && canMutate(role);
  const canImpersonate = role != null && hasPermission(role, Permission.IMPERSONATE_EMPLOYER);

  let sandbox;
  try {
    sandbox = await getSandboxContext(admin.isSuperAdmin ? "super_admin" : "admin");
  } catch {
    sandbox = { enabled: false, isSuperAdmin: false };
  }

  let impersonation;
  try {
    impersonation = await getImpersonationContext();
  } catch {
    impersonation = { isImpersonating: false };
  }

  return (
    <div className="p-8 space-y-6">
      {impersonation.isImpersonating && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 flex items-center justify-between">
          <span className="text-sm text-amber-900">
            Viewing as impersonated user{impersonation.userId ? ` (${impersonation.userId})` : ""}.
          </span>
          <Link
            href="/api/admin/impersonate/exit"
            className="text-sm font-medium text-amber-800 underline"
          >
            Exit impersonation
          </Link>
        </div>
      )}

      {role === AdminRole.PLATFORM_READ_ONLY && (
        <div className="rounded-lg border border-slate-300 bg-slate-100 p-4">
          <p className="text-sm font-medium text-slate-800">Read-only access</p>
          <p className="text-sm text-slate-600">You can view admin data but cannot make changes.</p>
        </div>
      )}

      {APP_MODE === "sandbox" && (
        <div className="mb-6 border border-amber-400 bg-amber-100 p-4 rounded-lg">
          <p className="font-semibold text-amber-900">SANDBOX MODE</p>
          <p className="text-sm text-amber-800">Sandbox is strictly more powerful than production.</p>
        </div>
      )}

      {admin.isSuperAdmin && canEdit && (
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

      {role != null && hasFeature(role, AdminFeature.ANALYTICS_DASHBOARD) && (
        <section className="mb-6">
          <h2 className="font-medium mb-3 text-slate-900">Activity & alerts</h2>
          <AdminActivityDashboard />
        </section>
      )}

      <section className="rounded-lg border border-slate-200 bg-slate-50 p-4 mb-6">
        <h2 className="font-medium mb-2 text-slate-900">What you can do here</h2>
        <p className="text-sm text-slate-700 mb-2">
          This panel is for WorkVouch platform admins. You can view organizations, users, usage, and
          audit logs. {canEdit && "As a full admin you can also edit users, manage orgs, and use sandbox."}
        </p>
        {canImpersonate && (
          <p className="text-sm text-amber-800 mt-2 font-medium">
            Impersonation is enabled for your role. Exit via the admin bar or the link above.
          </p>
        )}
      </section>

      <section>
        <h2 className="font-medium mb-2">Admin Tools</h2>
        <ul className="list-disc ml-6 space-y-1">
          <li><Link href="/admin/users" className="hover:underline">User search (email, name, org)</Link></li>
          <li><Link href="/admin/organizations" className="hover:underline">Org search & management</Link></li>
          <li><Link href="/admin/employer-usage" className="hover:underline">Employer Usage</Link></li>
          <li><Link href="/admin/locations" className="hover:underline">Locations</Link></li>
          <li><Link href="/admin/feature-flags" className="hover:underline">Feature flags (per org)</Link></li>
          <li><Link href="/admin/audit-logs" className="hover:underline">Audit logs (read-only)</Link></li>
          {process.env.NEXT_PUBLIC_ORG_HEALTH_PLACEHOLDER_VISIBLE === "true" && (
            <li><Link href="/admin/org-health" className="hover:underline">Org health (placeholder)</Link></li>
          )}
        </ul>
      </section>

      <section>
        <h2 className="font-medium mb-2">Monitoring</h2>
        <ul className="list-disc ml-6 space-y-1">
          <li><Link href="/admin/abuse" className="hover:underline">Abuse Signals</Link></li>
          <li><Link href="/admin/scale-metrics" className="hover:underline">Scale Metrics</Link></li>
        </ul>
      </section>

      <section>
        <h2 className="font-medium mb-2">Store & compliance</h2>
        <ul className="list-disc ml-6 space-y-1">
          <li><Link href="/admin/store-readiness" className="hover:underline">App Store Readiness Checklist</Link></li>
          <li><Link href="/admin/resumes" className="hover:underline">Resumes (list by user/org)</Link></li>
        </ul>
      </section>

      {role != null && hasFeature(role, AdminFeature.SOC2_REPORTS) && (
        <section>
          <h2 className="font-medium mb-2">Access & activity reports</h2>
          <ul className="list-disc ml-6 space-y-1">
            <li>
              <Link href="/api/admin/export?type=soc2" className="hover:underline" download>
                SOC-2 style admin access report (CSV)
              </Link>
            </li>
            <li><Link href="/admin/audit-logs" className="hover:underline">Audit logs (read-only)</Link></li>
          </ul>
        </section>
      )}

      {admin.isSuperAdmin && canEdit && (
        <section>
          <h2 className="font-medium mb-2">Superadmin</h2>
          <ul className="list-disc ml-6 space-y-1">
            <li><Link href="/admin/impersonate" className="hover:underline">Impersonate</Link></li>
            <li><Link href="/admin/sandbox" className="hover:underline">Sandbox</Link></li>
            <li><Link href="/admin/enterprise-load-simulation" className="hover:underline">Enterprise Simulator</Link></li>
          </ul>
        </section>
      )}

      {APP_MODE === "sandbox" && admin.isSuperAdmin && canEdit && (
        <section className="mt-6 p-4 rounded-lg border border-emerald-200 bg-emerald-50">
          <h2 className="font-medium mb-2 text-emerald-900">Sandbox-only tools</h2>
          <ul className="list-disc ml-6 space-y-1 text-emerald-800">
            <li><Link href="/superadmin/impersonate" className="hover:underline">Impersonate User</Link></li>
            <li><Link href="/admin/sandbox-v2" className="hover:underline">Seed Fake Activity / Sandbox V2</Link></li>
            <li><Link href="/admin/seed-demo-orgs" className="hover:underline">Re-seed demo orgs</Link></li>
          </ul>
        </section>
      )}
    </div>
  );
}
