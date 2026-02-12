import { requireAdmin } from "@/lib/auth/requireAdmin";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function MetricCard({
  label,
  value,
  href,
}: {
  label: string;
  value: string | number;
  href?: string;
}) {
  const content = (
    <div className="p-4">
      <p className="text-[#64748B] text-sm font-medium">{label}</p>
      <p className="text-[#0F172A] font-bold text-2xl mt-1">{value}</p>
    </div>
  );
  const cardClass =
    "bg-white border border-[#E2E8F0] rounded-2xl shadow-lg hover:shadow-xl transition-shadow";
  if (href) {
    return (
      <Link href={href} className={`block ${cardClass}`}>
        {content}
      </Link>
    );
  }
  return <div className={cardClass}>{content}</div>;
}

function QuickActionCard({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="block p-4 bg-white border border-[#E2E8F0] rounded-xl hover:shadow-md transition-shadow"
    >
      <h3 className="font-semibold text-[#0F172A]">{title}</h3>
      <p className="text-[#334155] text-sm mt-0.5">{description}</p>
    </Link>
  );
}

export default async function AdminPanel() {
  const { supabase } = await requireAdmin();

  const supabaseAny = supabase as any;
  const { data: profiles } = await supabaseAny
    .from("profiles")
    .select("id, email, full_name, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  const { data: userRoles } = await supabaseAny
    .from("user_roles")
    .select("user_id, role");

  const [profilesCount, employersCount, claimRequestsData, disputesData] = await Promise.all([
    supabaseAny.from("profiles").select("id", { count: "exact", head: true }),
    supabaseAny.from("employer_accounts").select("id", { count: "exact", head: true }),
    supabaseAny.from("employer_claim_requests").select("id").eq("status", "pending"),
    supabaseAny.from("employer_disputes").select("id").neq("status", "resolved"),
  ]);

  const totalUsers =
    typeof profilesCount.count === "number" ? profilesCount.count : (profiles?.length ?? 0);
  const totalEmployers =
    typeof employersCount.count === "number" ? employersCount.count : 0;
  const pendingClaims = Array.isArray(claimRequestsData.data) ? claimRequestsData.data.length : 0;
  const openDisputes = Array.isArray(disputesData.data) ? disputesData.data.length : 0;

  const rolesMap = new Map<string, string[]>();
  if (userRoles) {
    for (const ur of userRoles as { user_id: string; role: string }[]) {
      const userId = ur.user_id;
      if (!rolesMap.has(userId)) rolesMap.set(userId, []);
      rolesMap.get(userId)!.push(ur.role);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#0F172A] mb-2">Admin Overview</h1>
        <p className="text-[#334155]">
          Command center: metrics, recent users, alerts, and quick actions. Use the sidebar for full navigation.
        </p>
      </div>

      {/* Overview metrics */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-[#0F172A] mb-4">Overview</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard label="Total users" value={totalUsers.toLocaleString()} href="/admin/users" />
          <MetricCard label="Employers" value={totalEmployers.toLocaleString()} href="/admin/employer-usage" />
          <MetricCard label="Pending claim requests" value={pendingClaims} href="/admin/claim-requests" />
          <MetricCard label="Open disputes" value={openDisputes} href="/admin/disputes" />
        </div>
      </section>

      {/* Alerts */}
      {(pendingClaims > 0 || openDisputes > 0) && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-[#0F172A] mb-4">Alerts</h2>
          <div className="flex flex-wrap gap-3">
            {pendingClaims > 0 && (
              <Link
                href="/admin/claim-requests"
                className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-300 rounded-xl text-amber-800 hover:bg-amber-100 transition-colors"
              >
                <span className="font-bold">{pendingClaims}</span>
                <span>pending claim request{pendingClaims !== 1 ? "s" : ""}</span>
              </Link>
            )}
            {openDisputes > 0 && (
              <Link
                href="/admin/disputes"
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-300 rounded-xl text-red-800 hover:bg-red-100 transition-colors"
              >
                <span className="font-bold">{openDisputes}</span>
                <span>open dispute{openDisputes !== 1 ? "s" : ""}</span>
              </Link>
            )}
          </div>
        </section>
      )}

      {/* Quick actions */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-[#0F172A] mb-4">Quick actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <QuickActionCard href="/admin/users" title="Manage Users" description="View and manage all user accounts" />
          <QuickActionCard href="/admin/claim-requests" title="Claim Requests" description="Approve or reject company claims" />
          <QuickActionCard href="/admin/intelligence-dashboard" title="Intelligence" description="Profile strength, risk, hiring confidence" />
          <QuickActionCard href="/admin/sandbox-v2" title="Sandbox" description="Enterprise simulation environment" />
        </div>
      </section>

      {/* Recent users */}
      <Card className="p-6 bg-white border border-[#E2E8F0] rounded-2xl shadow-lg">
        <h2 className="text-xl font-semibold text-[#0F172A] mb-4">
          Recent Users ({profiles?.length ?? 0})
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full rounded-xl overflow-hidden">
            <thead className="bg-slate-50">
              <tr>
                <th className="py-3 px-4 text-left text-sm font-semibold text-[#0F172A]">Email</th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-[#0F172A]">Name</th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-[#0F172A]">Roles</th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-[#0F172A]">Joined</th>
              </tr>
            </thead>
            <tbody>
              {profiles && profiles.length > 0 ? (
                (profiles as { id: string; email?: string; full_name?: string; created_at: string }[]).map((profile) => {
                  const userRolesList = rolesMap.get(profile.id) || [];
                  return (
                    <tr
                      key={profile.id}
                      className="border-b border-[#E2E8F0] hover:bg-slate-50 transition-colors"
                    >
                      <td className="py-3 px-4 text-sm text-[#334155]">{profile.email || "N/A"}</td>
                      <td className="py-3 px-4 text-sm text-[#334155]">{profile.full_name || "N/A"}</td>
                      <td className="py-3 px-4 text-sm">
                        <div className="flex flex-wrap gap-1">
                          {userRolesList.length > 0 ? (
                            userRolesList.map((r) => (
                              <Badge
                                key={r}
                                variant={
                                  r === "superadmin" ? "destructive" : r === "admin" ? "warning" : r === "employer" ? "info" : "default"
                                }
                              >
                                {r}
                              </Badge>
                            ))
                          ) : (
                            <Badge variant="secondary">user</Badge>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-[#64748B]">
                        {new Date(profile.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-[#64748B]">
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="mt-4">
          <Link href="/admin/users">
            <Button variant="secondary">
              View All Users
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
