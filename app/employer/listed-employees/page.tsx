import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { hasRole } from "@/lib/auth";
import { createServerSupabase } from "@/lib/supabase/server";
import { ListedEmployeesPageClient } from "./ListedEmployeesPageClient";

export const dynamic = "force-dynamic";

export default async function ListedEmployeesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!(await hasRole("employer"))) redirect("/dashboard");

  const supabase = await createServerSupabase();
  const supabaseAny = supabase as any;
  const { data: account } = await supabaseAny.from("employer_accounts").select("id, plan_tier").eq("user_id", user.id).single();
  if (!account) redirect("/employer/dashboard");

  return (
    <div className="min-h-screen bg-background dark:bg-[#0D1117] p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-grey-dark dark:text-gray-200 mb-2">Employees Who Listed You</h1>
        <p className="text-grey-medium dark:text-gray-400 mb-6 text-sm">
          People who added your company to their employment history. View, confirm, or request verification.
        </p>
        <ListedEmployeesPageClient employerId={(account as { id: string }).id} planTier={(account as { plan_tier?: string }).plan_tier ?? "free"} />
      </div>
    </div>
  );
}
