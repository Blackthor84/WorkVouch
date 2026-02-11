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
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center gap-4">
        <Button variant="ghost" size="sm" href="/admin/users">
          ← Back to users
        </Button>
      </div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[#0F172A] mb-2">
          User: {row.full_name || row.email || id}
        </h1>
        <p className="text-[#334155]">
          Manage account and view profile
        </p>
      </div>

      <UserForensicsTabs
        userId={id}
        isEmployer={row.role === "employer" || userRoles.includes("employer")}
        overviewContent={
          <>
            <div className="rounded-xl border border-[#E2E8F0] bg-white p-6 mb-4">
              <h2 className="text-lg font-semibold text-[#0F172A] mb-4">Profile Overview</h2>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div><dt className="text-[#64748B]">Name</dt><dd className="font-medium text-[#0F172A]">{row.full_name || "—"}</dd></div>
                <div><dt className="text-[#64748B]">Email</dt><dd className="font-medium text-[#0F172A]">{row.email || "—"}</dd></div>
                <div><dt className="text-[#64748B]">Role</dt><dd className="font-medium text-[#0F172A]">{row.role || "—"}</dd></div>
                <div><dt className="text-[#64748B]">Industry</dt><dd className="font-medium text-[#0F172A]">{row.industry || "—"}</dd></div>
                <div><dt className="text-[#64748B]">Status</dt><dd className="font-medium text-[#0F172A] capitalize">{status}</dd></div>
                <div><dt className="text-[#64748B]">Risk Level</dt><dd className="font-medium text-[#0F172A] capitalize">{riskLevel}</dd></div>
                <div><dt className="text-[#64748B]">Profile Strength</dt><dd className="font-medium text-[#0F172A]">{profileStrength != null ? `${Number(profileStrength).toFixed(1)}` : "—"}</dd></div>
                {row.flagged_for_fraud && <div className="sm:col-span-2"><span className="inline-flex items-center rounded-md bg-red-100 px-2 py-1 text-xs font-medium text-red-800">Flagged for fraud</span></div>}
              </dl>
              <UserDetailActions userId={id} currentStatus={status} currentRole={row.role ?? ""} isSuperAdmin={isSuperAdmin} fullName={row.full_name ?? ""} email={row.email ?? ""} industry={row.industry ?? ""} />
            </div>
          </>
        }
      />
    </div>
  );
}
