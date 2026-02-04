import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { IntelligenceSandboxClient } from "./IntelligenceSandboxClient";

export const dynamic = "force-dynamic";

export default async function AdminIntelligenceSandboxPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const roles = (session.user as { roles?: string[] }).roles ?? [];
  const isAdmin = roles.includes("admin") || roles.includes("superadmin");
  if (!isAdmin) redirect("/dashboard");

  const supabase = getSupabaseServer();
  const { data: employers } = await supabase
    .from("employer_accounts")
    .select("id, company_name")
    .order("company_name")
    .limit(100);
  const employerList = (employers ?? []) as { id: string; company_name?: string }[];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <IntelligenceSandboxClient employerList={employerList} />
    </div>
  );
}
