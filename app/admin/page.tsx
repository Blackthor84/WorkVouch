import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { getCurrentUserProfile, getCurrentUserRoles } from "@/lib/auth";
import { isAdmin as isAdminRole, isSuperAdmin as isSuperAdminRole } from "@/lib/roles";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

// Mark as dynamic
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function SectionCard({
  href,
  title,
  description,
  borderClass = "",
}: {
  href: string;
  title: string;
  description: string;
  borderClass?: string;
}) {
  return (
    <Card className={`p-4 hover:shadow-lg transition-shadow ${borderClass}`}>
      <Link href={href} className="block">
        <h3 className="font-semibold text-grey-dark dark:text-gray-200">{title}</h3>
        <p className="text-sm text-grey-medium dark:text-gray-400 mt-0.5">{description}</p>
      </Link>
    </Card>
  );
}

export default async function AdminPanel() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const profile = await getCurrentUserProfile();
  const roles = await getCurrentUserRoles();
  const role = profile?.role ?? roles[0] ?? null;
  if (!isAdminRole(role) && !roles.some((r) => isAdminRole(r))) {
    redirect("/dashboard");
  }

  const isSuperAdmin = isSuperAdminRole(role) || roles.includes("superadmin");

  const supabase = getSupabaseServer();

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, email, full_name, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  const { data: userRoles } = await supabase
    .from("user_roles")
    .select("user_id, role");

  const rolesMap = new Map<string, string[]>();
  if (userRoles) {
    for (const ur of userRoles as any[]) {
      const userId = ur.user_id;
      if (!rolesMap.has(userId)) {
        rolesMap.set(userId, []);
      }
      rolesMap.get(userId)!.push(ur.role);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 bg-background dark:bg-[#0D1117] min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-grey-dark dark:text-gray-200 mb-2">
          Admin Panel
        </h1>
        <p className="text-grey-medium dark:text-gray-400">
          Manage users, disputes, and verification requests
        </p>
      </div>

      {/* 1. Moderation */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-grey-dark dark:text-gray-200 mb-3">Moderation</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <SectionCard href="/admin/users" title="Manage Users" description="View and manage all user accounts" />
          <SectionCard href="/admin/disputes" title="Disputes Queue" description="Review and resolve employer disputes" />
          <SectionCard href="/admin/verifications" title="Verification Requests" description="Approve or reject verification requests" />
          <SectionCard href="/admin/claim-requests" title="Employer Claim Requests" description="Approve or reject company claim requests" />
        </div>
      </section>

      {/* 2. Intelligence Center — single tile to hub, with sub-links */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-grey-dark dark:text-gray-200 mb-3">Intelligence Center</h2>
        <Card className="p-6 hover:shadow-lg transition-shadow border-2 border-cyan-500/80">
          <Link href="/admin/intelligence-dashboard" className="block mb-4">
            <h3 className="text-xl font-semibold text-cyan-600 dark:text-cyan-400">Enterprise Intelligence</h3>
            <p className="text-sm text-grey-medium dark:text-gray-400 mt-1">
              Profile strength, career health, risk, fraud, team fit, hiring confidence. Admin/SuperAdmin only.
            </p>
          </Link>
          <div className="flex flex-wrap gap-3 text-sm">
            <Link href="/admin/intelligence-dashboard" className="text-cyan-600 dark:text-cyan-400 hover:underline">Intelligence Dashboard</Link>
            <Link href="/admin/intelligence-preview" className="text-cyan-600 dark:text-cyan-400 hover:underline">Intelligence Preview</Link>
            <Link href="/admin/intelligence-health" className="text-cyan-600 dark:text-cyan-400 hover:underline">Integrity Health</Link>
            <Link href="/admin/employer-reputation-preview" className="text-cyan-600 dark:text-cyan-400 hover:underline">Employer Reputation Preview</Link>
          </div>
        </Card>
      </section>

      {/* 3. Simulation Lab — includes preview, preview-control, sandbox-v2, beta, investor (superadmin only) */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-grey-dark dark:text-gray-200 mb-3">Simulation Lab</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <SectionCard
            href="/admin/sandbox-v2"
            title="Enterprise Simulation Environment"
            description="Fully isolated sandbox: sessions, employers, employees, peer reviews, intelligence, ads, revenue."
            borderClass="border-2 border-emerald-500/80"
          />
          <SectionCard href="/admin/preview" title="Preview Panel" description="Preview career pages and onboarding flows" />
          <SectionCard href="/admin/preview-control" title="Preview & Simulation Control" description="Simulate roles, plans, features, limits. Client-side only." />
          <SectionCard href="/admin/beta" title="Beta Access Manager" description="Create temporary preview access with one-click login" borderClass="border-2 border-blue-500" />
          {isSuperAdmin && (
            <SectionCard
              href="/admin/investor"
              title="Investor Dashboard"
              description="Private metrics, real + simulated growth. Superadmin only."
              borderClass="border-2 border-red-500"
            />
          )}
        </div>
      </section>

      {/* 4. Revenue & Plans */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-grey-dark dark:text-gray-200 mb-3">Revenue & Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SectionCard href="/admin/employer-usage" title="Employer Usage" description="Plan, Stripe IDs, usage this cycle, overages, manual override" />
          <SectionCard href="/admin/ads" title="Ads Manager" description="Create and manage career-targeted advertisements" />
        </div>
      </section>

      {/* 5. System Controls — vertical-control for all; hidden-features, superadmin, signups for superadmin only */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-grey-dark dark:text-gray-200 mb-3">System Controls</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <SectionCard href="/admin/vertical-control" title="Vertical Control" description="Enable or disable verticals (Education, Construction, Security, etc.)." />
          {isSuperAdmin && (
            <>
              <SectionCard href="/admin/hidden-features" title="Hidden Features" description="Manage feature flags. Enable globally or assign to users/employers." borderClass="border-2 border-amber-500" />
              <SectionCard href="/admin/superadmin" title="Superadmin Control" description="Full system access and management" borderClass="border-2 border-red-500" />
              <SectionCard href="/admin/signups" title="All Signups" description="View complete list of all user signups" borderClass="border-2 border-red-500" />
            </>
          )}
        </div>
      </section>

      {/* Recent Users — unchanged */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-grey-dark dark:text-gray-200 mb-4">
          Recent Users ({profiles?.length || 0})
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white dark:bg-[#1A1F2B] rounded-xl shadow overflow-hidden">
            <thead className="bg-gray-100 dark:bg-[#0D1117]">
              <tr>
                <th className="py-3 px-4 text-left text-sm font-semibold text-grey-dark dark:text-gray-200">
                  Email
                </th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-grey-dark dark:text-gray-200">
                  Name
                </th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-grey-dark dark:text-gray-200">
                  Roles
                </th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-grey-dark dark:text-gray-200">
                  Joined
                </th>
              </tr>
            </thead>
            <tbody>
              {profiles && profiles.length > 0 ? (
                (profiles as any[]).map((profile) => {
                  const roles = rolesMap.get(profile.id) || [];
                  return (
                    <tr
                      key={profile.id}
                      className="border-b border-grey-background dark:border-[#374151] hover:bg-gray-50 dark:hover:bg-[#0D1117] transition-colors"
                    >
                      <td className="py-3 px-4 text-sm text-grey-dark dark:text-gray-200">
                        {profile.email || "N/A"}
                      </td>
                      <td className="py-3 px-4 text-sm text-grey-dark dark:text-gray-200">
                        {profile.full_name || "N/A"}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        <div className="flex flex-wrap gap-1">
                          {roles.length > 0 ? (
                            roles.map((role) => (
                              <Badge
                                key={role}
                                variant={
                                  role === "superadmin"
                                    ? "destructive"
                                    : role === "admin"
                                      ? "warning"
                                      : role === "employer"
                                        ? "info"
                                        : "default"
                                }
                              >
                                {role}
                              </Badge>
                            ))
                          ) : (
                            <Badge variant="primary">user</Badge>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-grey-medium dark:text-gray-400">
                        {new Date(profile.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={4}
                    className="py-8 text-center text-grey-medium dark:text-gray-400"
                  >
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="mt-4">
          <Link href="/admin/users">
            <Button variant="secondary">View All Users</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
