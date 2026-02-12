import { requireAdmin } from "@/lib/auth/requireAdmin";
import { AdminIntelligenceDashboardClient } from "./AdminIntelligenceDashboardClient";

export const dynamic = "force-dynamic";

export default async function AdminIntelligenceDashboardPage() {
  const { supabase } = await requireAdmin();
  const supabaseAny = supabase as any;
  const { data: profiles } = await supabaseAny
    .from("profiles")
    .select("id, email, full_name")
    .order("created_at", { ascending: false })
    .limit(200);
  const userList = (profiles ?? []) as { id: string; email?: string; full_name?: string }[];

  const { data: employers } = await supabaseAny
    .from("employer_accounts")
    .select("id, company_name")
    .order("company_name")
    .limit(100);
  const employerList = employers ?? [];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-[#0F172A] mb-2">Intelligence Dashboard</h1>
      <p className="text-[#334155] mb-6">
        Full enterprise intelligence breakdown: profile strength, career health, risk, fraud confidence, team fit, hiring confidence. Admin/superadmin only.
      </p>
      <AdminIntelligenceDashboardClient userList={userList} employerList={employerList} />
    </div>
  );
}
