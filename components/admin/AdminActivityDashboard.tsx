import { getRecentAdminActions, getHighRiskActions, runAdminAnomalyChecks } from "@/lib/admin/recentAdminActivity";
import { getAdminAlerts } from "@/lib/admin/adminAlertsStore";
import { getImpersonationContext } from "@/lib/admin-impersonation";
import Link from "next/link";

export const dynamic = "force-dynamic";

export async function AdminActivityDashboard() {
  await runAdminAnomalyChecks();
  const [recent, highRisk, alerts, impersonation] = await Promise.all([
    getRecentAdminActions(15),
    getHighRiskActions(10),
    Promise.resolve(getAdminAlerts(20)),
    getImpersonationContext().catch((): { isImpersonating: false } => ({ isImpersonating: false })),
  ]);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="mb-3 font-medium text-slate-900">Recent admin actions</h3>
        <ul className="space-y-2 text-sm">
          {recent.length === 0 && <li className="text-slate-500">No recent actions</li>}
          {recent.slice(0, 8).map((a) => (
            <li key={a.id} className="flex justify-between gap-2 border-b border-slate-100 pb-2 last:border-0">
              <span className="truncate text-slate-700">{a.action}</span>
              <span className="shrink-0 text-slate-500">{formatDate(a.created_at)}</span>
            </li>
          ))}
        </ul>
        <Link href="/admin/audit-logs" className="mt-2 inline-block text-sm text-blue-600 hover:underline">
          View all audit logs →
        </Link>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="mb-3 font-medium text-slate-900">High-risk actions</h3>
        <ul className="space-y-2 text-sm">
          {highRisk.length === 0 && <li className="text-slate-500">None</li>}
          {highRisk.slice(0, 6).map((a) => (
            <li key={a.id} className="flex justify-between gap-2 border-b border-slate-100 pb-2 last:border-0">
              <span className="truncate font-medium text-amber-800">{a.action}</span>
              <span className="shrink-0 text-slate-500">{formatDate(a.created_at)}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-lg border border-amber-200 bg-amber-50/50 p-4">
        <h3 className="mb-3 font-medium text-amber-900">Alerts & anomalies</h3>
        <ul className="space-y-2 text-sm">
          {alerts.length === 0 && <li className="text-slate-500">No alerts</li>}
          {alerts.slice(0, 8).map((a) => (
            <li key={a.id} className="flex justify-between gap-2 border-b border-amber-100 pb-2 last:border-0">
              <span className="truncate text-amber-900">{formatAlertType(a.type)}</span>
              <span className="shrink-0 text-slate-500">{formatDate(a.at)}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="mb-3 font-medium text-slate-900">Impersonation</h3>
        {impersonation.isImpersonating === true ? (
          <p className="text-sm text-amber-800">
            Currently viewing as {impersonation.userId}.{" "}
            <Link href="/api/admin/impersonate/exit" className="underline">Exit</Link>
          </p>
        ) : (
          <p className="text-sm text-slate-600">No active impersonation</p>
        )}
      </section>
    </div>
  );
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" });
  } catch {
    return iso;
  }
}

function formatAlertType(type: string): string {
  const map: Record<string, string> = {
    failed_admin_access: "Failed admin access",
    rapid_role_changes: "Rapid role changes",
    excessive_impersonation: "Excessive impersonation",
    after_hours_action: "After-hours action",
  };
  return map[type] ?? type;
}
