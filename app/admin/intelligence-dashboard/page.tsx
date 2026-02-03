import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { AdminIntelligenceDashboardClient } from "./AdminIntelligenceDashboardClient";
import { getSupabaseServer } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function AdminIntelligenceDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/auth/signin");

  const roles = (session.user as { roles?: string[] }).roles ?? [];
  const isAdmin = roles.includes("admin") || roles.includes("superadmin");
  if (!isAdmin) redirect("/dashboard");

  const supabase = getSupabaseServer();
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, email, full_name")
    .order("created_at", { ascending: false })
    .limit(200);
  const userList = (profiles ?? []) as { id: string; email?: string; full_name?: string }[];

  const { data: employers } = await supabase
    .from("employer_accounts")
    .select("id, company_name")
    .order("company_name")
    .limit(100);
  const employerList = (employers ?? []) as { id: string; company_name?: string }[];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-grey-dark dark:text-gray-200 mb-2">Intelligence Dashboard</h1>
      <p className="text-grey-medium dark:text-gray-400 mb-6">
        Full enterprise intelligence breakdown: profile strength, career health, risk, fraud confidence, team fit, hiring confidence. Admin/superadmin only.
      </p>
      <AdminIntelligenceDashboardClient userList={userList} employerList={employerList} />
    </div>
  );
}
