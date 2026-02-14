import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { createServerSupabase } from "@/lib/supabase/server";
import { EmployerOnboardingClient } from "../EmployerOnboardingClient";

export const dynamic = "force-dynamic";

/**
 * First employer onboarding entry point.
 * Steps: Org name → Industry → Org size → Primary admin email → Confirm & create.
 * Creates: org, org_admin (tenant_memberships enterprise_owner), employer role + employer_accounts.
 * Resumable on refresh. No demo data, no sandbox logic.
 */
export default async function EmployerOnboardingStartPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?callbackUrl=/employer/onboarding/start");
  }

  const supabase = await createServerSupabase();
  const supabaseAny = supabase as any;

  const [{ data: existingEmployer }, { data: existingMemberships }] = await Promise.all([
    supabaseAny.from("employer_accounts").select("id").eq("user_id", user.id).limit(1),
    supabaseAny.from("tenant_memberships").select("id").eq("user_id", user.id).eq("role", "enterprise_owner").limit(1),
  ]);

  const hasEmployer = Array.isArray(existingEmployer) && existingEmployer.length > 0;
  const hasOrgOwner = Array.isArray(existingMemberships) && existingMemberships.length > 0;
  if (hasEmployer && hasOrgOwner) {
    redirect("/employer/dashboard");
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0D1117] px-4 py-12">
      <EmployerOnboardingClient userEmail={user.email} />
    </div>
  );
}
