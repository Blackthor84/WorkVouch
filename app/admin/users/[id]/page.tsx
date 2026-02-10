import { redirect, notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { Button } from "@/components/ui/button";
import { UserDetailActions } from "@/components/admin/user-detail-actions";
import { UserForensicsTabs } from "@/components/admin/user-forensics-tabs";

export const dynamic = "force-dynamic";

type ProfileRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string | null;
  industry: string | null;
  status?: string | null;
  risk_level?: string | null;
  flagged_for_fraud?: boolean | null;
  deleted_at?: string | null;
  created_at?: string | null;
};

export default async function AdminUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  const roles = (session.user as { roles?: string[] }).roles ?? [];
  const isAdmin = roles.includes("admin") || roles.includes("superadmin");
  if (!isAdmin) redirect("/dashboard");

  const supabase = getSupabaseServer();

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, industry, status, risk_level, flagged_for_fraud, deleted_at, created_at")
    .eq("id", id)
    .single();

  if (error || !profile) {
    notFound();
  }

  const row = profile as unknown as ProfileRow;
  const { data: rolesData } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", id);
  const userRoles = ((rolesData ?? []) as { role: string }[]).map((r) => r.role);

  const { data: snapshot } = await supabase
    .from("intelligence_snapshots")
    .select("profile_strength")
    .eq("user_id", id)
    .is("is_simulation", null)
    .maybeSingle();
  const profileStrength = (snapshot as { profile_strength?: number } | null)?.profile_strength ?? null;

  const status = row.status ?? "active";
  const riskLevel = row.risk_level ?? "low";
  const isSuperAdmin = roles.includes("superadmin");

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 bg-background dark:bg-[#0D1117] min-h-screen">
      <div className="mb-6 flex items-center gap-4">
        <Button variant="ghost" size="sm" href="/admin/users">
          ← Back to users
        </Button>
      </div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-grey-dark dark:text-gray-200 mb-2">
          User: {row.full_name || row.email || id}
        </h1>
        <p className="text-grey-medium dark:text-gray-400">
          Manage account and view profile
        </p>
      </div>

      <UserForensicsTabs
        userId={id}
        isEmployer={row.role === "employer" || userRoles.includes("employer")}
        overviewContent={
          <>
            <div className="rounded-xl border border-grey-background dark:border-[#374151] bg-white dark:bg-[#111827] p-6 mb-4">
              <h2 className="text-lg font-semibold text-grey-dark dark:text-gray-200 mb-4">Profile Overview</h2>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div><dt className="text-grey-medium dark:text-gray-400">Name</dt><dd className="font-medium text-grey-dark dark:text-gray-200">{row.full_name || "—"}</dd></div>
                <div><dt className="text-grey-medium dark:text-gray-400">Email</dt><dd className="font-medium text-grey-dark dark:text-gray-200">{row.email || "—"}</dd></div>
                <div><dt className="text-grey-medium dark:text-gray-400">Role</dt><dd className="font-medium text-grey-dark dark:text-gray-200">{row.role || "—"}</dd></div>
                <div><dt className="text-grey-medium dark:text-gray-400">Industry</dt><dd className="font-medium text-grey-dark dark:text-gray-200">{row.industry || "—"}</dd></div>
                <div><dt className="text-grey-medium dark:text-gray-400">Status</dt><dd className="font-medium text-grey-dark dark:text-gray-200 capitalize">{status}</dd></div>
                <div><dt className="text-grey-medium dark:text-gray-400">Risk Level</dt><dd className="font-medium text-grey-dark dark:text-gray-200 capitalize">{riskLevel}</dd></div>
                <div><dt className="text-grey-medium dark:text-gray-400">Profile Strength</dt><dd className="font-medium text-grey-dark dark:text-gray-200">{profileStrength != null ? `${Number(profileStrength).toFixed(1)}` : "—"}</dd></div>
                {row.flagged_for_fraud && <div className="sm:col-span-2"><span className="inline-flex items-center rounded-md bg-red-100 dark:bg-red-900/30 px-2 py-1 text-xs font-medium text-red-800 dark:text-red-400">Flagged for fraud</span></div>}
              </dl>
              <UserDetailActions userId={id} currentStatus={status} currentRole={row.role ?? ""} isSuperAdmin={isSuperAdmin} fullName={row.full_name ?? ""} industry={row.industry ?? ""} />
            </div>
          </>
        }
      />
    </div>
  );
}
