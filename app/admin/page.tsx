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


  // Create a map of user_id -> roles
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

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <Link href="/admin/users" className="block">
              <h2 className="text-xl font-semibold text-grey-dark dark:text-gray-200 mb-2">
                Manage Users
              </h2>
              <p className="text-sm text-grey-medium dark:text-gray-400">
                View and manage all user accounts
              </p>
            </Link>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <Link href="/admin/disputes" className="block">
              <h2 className="text-xl font-semibold text-grey-dark dark:text-gray-200 mb-2">
                Disputes Queue
              </h2>
              <p className="text-sm text-grey-medium dark:text-gray-400">
                Review and resolve employer disputes
              </p>
            </Link>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <Link href="/admin/verifications" className="block">
              <h2 className="text-xl font-semibold text-grey-dark dark:text-gray-200 mb-2">
                Verification Requests
              </h2>
              <p className="text-sm text-grey-medium dark:text-gray-400">
                Approve or reject verification requests
              </p>
            </Link>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <Link href="/admin/claim-requests" className="block">
              <h2 className="text-xl font-semibold text-grey-dark dark:text-gray-200 mb-2">
                Employer Claim Requests
              </h2>
              <p className="text-sm text-grey-medium dark:text-gray-400">
                Approve or reject company claim requests
              </p>
            </Link>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <Link href="/admin/employer-reputation-preview" className="block">
              <h2 className="text-xl font-semibold text-grey-dark dark:text-gray-200 mb-2">
                Employer Reputation Preview
              </h2>
              <p className="text-sm text-grey-medium dark:text-gray-400">
                View reputation breakdown and generate 10-min synthetic preview
              </p>
            </Link>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <Link href="/admin/employer-usage" className="block">
              <h2 className="text-xl font-semibold text-grey-dark dark:text-gray-200 mb-2">
                Employer Usage
              </h2>
              <p className="text-sm text-grey-medium dark:text-gray-400">
                Plan, Stripe IDs, usage this cycle, overages, manual override
              </p>
            </Link>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <Link href="/admin/ads" className="block">
              <h2 className="text-xl font-semibold text-grey-dark dark:text-gray-200 mb-2">
                Ads Manager
              </h2>
              <p className="text-sm text-grey-medium dark:text-gray-400">
                Create and manage career-targeted advertisements
              </p>
            </Link>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <Link href="/admin/preview" className="block">
              <h2 className="text-xl font-semibold text-grey-dark dark:text-gray-200 mb-2">
                Preview Panel
              </h2>
              <p className="text-sm text-grey-medium dark:text-gray-400">
                Preview career pages and onboarding flows
              </p>
            </Link>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <Link href="/admin/preview-control" className="block">
              <h2 className="text-xl font-semibold text-grey-dark dark:text-gray-200 mb-2">
                Preview &amp; Simulation Control
              </h2>
              <p className="text-sm text-grey-medium dark:text-gray-400">
                Simulate roles, plans, features, limits. Client-side only.
              </p>
            </Link>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow border-2 border-blue-500">
            <Link href="/admin/beta" className="block">
              <h2 className="text-xl font-semibold text-blue-600 dark:text-blue-400 mb-2">
                Beta Access Manager
              </h2>
              <p className="text-sm text-grey-medium dark:text-gray-400">
                Create temporary preview access with one-click login
              </p>
            </Link>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow border-2 border-amber-500">
            <Link href="/admin/hidden-features" className="block">
              <h2 className="text-xl font-semibold text-amber-600 dark:text-amber-400 mb-2">
                Hidden Features
              </h2>
              <p className="text-sm text-grey-medium dark:text-gray-400">
                Manage feature flags. Enable globally or assign to users/employers. Admin and SuperAdmin only.
              </p>
            </Link>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow border-2 border-cyan-500/80">
            <Link href="/admin/intelligence-dashboard" className="block">
              <h2 className="text-xl font-semibold text-cyan-600 dark:text-cyan-400 mb-2">
                Intelligence Dashboard
              </h2>
              <p className="text-sm text-grey-medium dark:text-gray-400">
                Full enterprise intelligence: profile strength, career health, risk, fraud, team fit, hiring confidence. Admin/SuperAdmin only.
              </p>
            </Link>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow border-2 border-amber-500/80">
            <Link href="/admin/intelligence-sandbox" className="block">
              <h2 className="text-xl font-semibold text-amber-600 dark:text-amber-400 mb-2">
                Intelligence Sandbox
              </h2>
              <p className="text-sm text-grey-medium dark:text-gray-400">
                Simulate behavioral baselines, team fit, risk, hiring confidence with fake test data. Auto-expires in 10 min. Admin/SuperAdmin only.
              </p>
            </Link>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <Link href="/admin/intelligence-preview" className="block">
              <h2 className="text-xl font-semibold text-grey-dark dark:text-gray-200 mb-2">
                Intelligence Preview
              </h2>
              <p className="text-sm text-grey-medium dark:text-gray-400">
                Team fit, risk, network density, hiring confidence by candidate.
              </p>
            </Link>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow border-2 border-violet-500">
            <Link href="/admin/simulate" className="block">
              <h2 className="text-xl font-semibold text-violet-600 dark:text-violet-400 mb-2">
                Elite Simulation
              </h2>
              <p className="text-sm text-grey-medium dark:text-gray-400">
                Plan limits, seats, reports, searches. Revenue and Ads demo dashboards when demo is active.
              </p>
            </Link>
          </Card>
          <Card className="p-6 hover:shadow-lg transition-shadow border-2 border-emerald-500/80 hover:border-emerald-500">
            <Link href="/admin/demo" className="block">
              <h2 className="text-xl font-semibold text-emerald-600 dark:text-emerald-400 mb-2">
                Demo Simulator
              </h2>
              <p className="text-sm text-grey-medium dark:text-gray-400">
                Employer, Worker, Advertiser, and Analytics demos. Fake data only — no database, no feature flags.
              </p>
            </Link>
          </Card>
          <Card className="p-6 hover:shadow-lg transition-shadow border-2 border-violet-500/80">
            <Link href="/admin/demo/revenue" className="block">
              <h2 className="text-xl font-semibold text-violet-600 dark:text-violet-400 mb-2">
                Demo: Revenue
              </h2>
              <p className="text-sm text-grey-medium dark:text-gray-400">
                Fake MRR, revenue, churn. Visible when Elite Demo is active.
              </p>
            </Link>
          </Card>
          <Card className="p-6 hover:shadow-lg transition-shadow border-2 border-violet-500/80">
            <Link href="/admin/demo/ads" className="block">
              <h2 className="text-xl font-semibold text-violet-600 dark:text-violet-400 mb-2">
                Demo: Ads ROI
              </h2>
              <p className="text-sm text-grey-medium dark:text-gray-400">
                Impressions, clicks, CTR, spend, ROI. Visible when Elite Demo is active.
              </p>
            </Link>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow border-2 border-slate-500 dark:border-slate-500">
            <Link href="/admin/investor-demo" className="block">
              <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Investor Demo
              </h2>
              <p className="text-sm text-grey-medium dark:text-gray-400">
                Revenue simulation, growth metrics, advertiser ROI, feature flags, simulation controls. Boardroom-only. Not indexed.
              </p>
            </Link>
          </Card>

          {isSuperAdmin && (
            <>
              <Card className="p-6 hover:shadow-lg transition-shadow border-2 border-red-500">
                <Link href="/admin/superadmin" className="block">
                  <h2 className="text-xl font-semibold text-red-600 dark:text-red-400 mb-2">
                    Superadmin Control
                  </h2>
                  <p className="text-sm text-grey-medium dark:text-gray-400">
                    Full system access and management
                  </p>
                </Link>
              </Card>
              <Card className="p-6 hover:shadow-lg transition-shadow border-2 border-red-500">
                <Link href="/admin/investor" className="block">
                  <h2 className="text-xl font-semibold text-red-600 dark:text-red-400 mb-2">
                    Investor Dashboard
                  </h2>
                  <p className="text-sm text-grey-medium dark:text-gray-400">
                    Private metrics, real + simulated growth. Not in navbar. Superadmin only.
                  </p>
                </Link>
              </Card>
              <Card className="p-6 hover:shadow-lg transition-shadow border-2 border-red-500">
                <Link href="/admin/signups" className="block">
                  <h2 className="text-xl font-semibold text-red-600 dark:text-red-400 mb-2">
                    All Signups
                  </h2>
                  <p className="text-sm text-grey-medium dark:text-gray-400">
                    View complete list of all user signups
                  </p>
                </Link>
              </Card>
            </>
          )}
        </div>

        {/* Users Table */}
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
                              <Badge variant="default">user</Badge>
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
