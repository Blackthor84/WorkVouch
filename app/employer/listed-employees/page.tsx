import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { hasRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ListedEmployeesPageClient } from "./ListedEmployeesPageClient";
import { EmployerPortalLayout } from "@/components/employer/EmployerPortalLayout";
import { WvPageHeader } from "@/components/wv";

export const dynamic = "force-dynamic";

export default async function ListedEmployeesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!(await hasRole("employer"))) redirect("/dashboard");

  const supabase = await createClient();
  const supabaseAny = supabase as any;
  const { data: account } = await supabaseAny.from("employer_accounts").select("id, plan_tier").eq("user_id", user.id).single();
  if (!account) redirect("/employer/dashboard");

  return (
    <EmployerPortalLayout>
      <WvPageHeader
        eyebrow="Workforce"
        title="Employees Who Listed You"
        description="People who added your company to their employment history. View, confirm, or request verification."
      />
      <div className="mt-8 max-w-5xl">
        <ListedEmployeesPageClient
          employerId={(account as { id: string }).id}
          planTier={(account as { plan_tier?: string }).plan_tier ?? "free"}
        />
      </div>
    </EmployerPortalLayout>
  );
}
