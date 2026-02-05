import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/roles";
import { getCurrentUserProfile, getCurrentUserRoles } from "@/lib/auth";
import { CommandCenterClient } from "./CommandCenterClient";

export const dynamic = "force-dynamic";

export default async function AdminSandboxPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const profile = await getCurrentUserProfile();
  const roles = await getCurrentUserRoles();
  const role = profile?.role ?? roles[0] ?? null;
  if (!isAdmin(role) && !roles.some((r) => isAdmin(r))) {
    redirect("/dashboard");
  }

  const supabase = getSupabaseServer();
  const { data: employers } = await supabase
    .from("employer_accounts")
    .select("id, company_name")
    .order("company_name")
    .limit(100);
  const employerList = (employers ?? []) as { id: string; company_name?: string }[];

  return <CommandCenterClient employerList={employerList} role={role ?? null} />;
}
