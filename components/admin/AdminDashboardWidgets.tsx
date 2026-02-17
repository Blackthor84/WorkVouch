import Link from "next/link";
import type { DashboardCounts } from "@/lib/admin/dashboardCounts";
import type { RecentAdminAction } from "@/lib/admin/recentAdminActivity";

export const dynamic = "force-dynamic";

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" });
  } catch {
    return iso;
  }
}

interface AdminDashboardWidgetsProps {
  counts: DashboardCounts;
  recentActions: RecentAdminAction[];
  isSandbox: boolean;
  canEnterSandbox: boolean;
}

/**
 * Basic metrics (users, employers, employees, recent signups) and situational awareness:
 * flagged users, disputes, recent actions, sandbox status. CTAs for review and enter sandbox.
 */
export function AdminDashboardWidgets({
  counts,
  recentActions,
  isSandbox,
  canEnterSandbox,
}: AdminDashboardWidgetsProps) {
  const recent = recentActions;

  return (
    <section className="mb-8">
      <h2 className="text-lg font-semibold text-[#0F172A] mb-4">Basic metrics</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <Link
          href="/admin/users"
          className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-slate-300 hover:shadow transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-600">Total users</span>
            <span className="text-2xl font-bold text-[#0F172A]">{counts.totalUsers}</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">All profiles</p>
        </Link>
        <Link
          href="/admin/organizations"
          className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-slate-300 hover:shadow transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-600">Total employers</span>
            <span className="text-2xl font-bold text-[#0F172A]">{counts.totalEmployers}</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">Employer accounts</p>
        </Link>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-600">Total employees</span>
            <span className="text-2xl font-bold text-[#0F172A]">{counts.totalEmployees}</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">Non-employer users</p>
        </div>
        <Link
          href="/admin/signups"
          className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-slate-300 hover:shadow transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-600">Recent signups</span>
            <span className="text-2xl font-bold text-[#0F172A]">{counts.recentSignups}</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">Last 7 days</p>
        </Link>
      </div>

      <h2 className="text-lg font-semibold text-[#0F172A] mb-4 mt-8">Situational awareness</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-6">
        <Link
          href="/admin/users?flagged=1"
          className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-red-200 hover:shadow transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-600">Flagged users</span>
            <span className="text-2xl font-bold text-red-600">{counts.flaggedUsers}</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">Review flagged for fraud</p>
        </Link>

        <Link
          href="/admin/disputes"
          className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-amber-200 hover:shadow transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-600">Employer disputes</span>
            <span className="text-2xl font-bold text-amber-600">{counts.openDisputes}</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">Open / under review</p>
        </Link>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-600">Sandbox status</span>
            <span
              className={`text-sm font-semibold ${isSandbox ? "text-amber-600" : "text-slate-600"}`}
            >
              {isSandbox ? "🧪 Active" : "Production"}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {isSandbox ? "No production data affected" : "Toggle in Sandbox to test"}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm mb-6">
        <h3 className="font-medium text-slate-900 mb-3">Recent admin actions</h3>
        <ul className="space-y-2 text-sm">
          {recent.length === 0 && <li className="text-slate-500">No recent actions</li>}
          {recent.slice(0, 8).map((a) => (
            <li
              key={a.id}
              className="flex justify-between gap-2 border-b border-slate-100 pb-2 last:border-0"
            >
              <span className="truncate text-slate-700">{a.action_type}</span>
              <span className="shrink-0 text-slate-500">{formatDate(a.created_at)}</span>
            </li>
          ))}
        </ul>
        <Link
          href="/admin/audit-logs"
          className="mt-2 inline-block text-sm text-blue-600 hover:underline"
        >
          View all audit logs →
        </Link>
      </div>

      <div className="flex flex-wrap gap-3">
        {counts.flaggedUsers > 0 && (
          <Link
            href="/admin/users?flagged=1"
            className="inline-flex items-center rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Review flagged users
          </Link>
        )}
        <Link
          href="/admin/trust-scores"
          className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Review trust issues
        </Link>
        {canEnterSandbox && !isSandbox && (
          <Link
            href="/admin/sandbox/enter"
            className="inline-flex items-center rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
          >
            Enter sandbox mode
          </Link>
        )}
      </div>
    </section>
  );
}
