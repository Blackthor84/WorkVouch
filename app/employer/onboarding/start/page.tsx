import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { EmployerOnboardingClient } from "../EmployerOnboardingClient";
import { WvShell } from "@/components/wv";

export const dynamic = "force-dynamic";

/**
 * First employer onboarding entry point.
 * Steps: Org name → Industry → Org size → Primary admin email → Confirm & create.
 */
export default async function EmployerOnboardingStartPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?callbackUrl=/employer/onboarding/start");
  }

  const supabase = await createClient();
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
    <WvShell>
      <div className="mx-auto max-w-lg px-4 py-12">
        <Suspense fallback={<div className="text-wv-muted p-6">Loading…</div>}>
          <EmployerOnboardingClient userEmail={user.email} />
        </Suspense>
      </div>
    </WvShell>
  );
}
