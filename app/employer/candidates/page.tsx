import { redirect } from "next/navigation";
import { getCurrentUser, hasRole } from "@/lib/auth";
import { EmployerPortalLayout } from "@/components/employer/EmployerPortalLayout";
import { EmployerCandidatesDirectoryClient } from "@/components/employer/EmployerCandidatesDirectoryClient";
import { WvPageHeader, WvButton } from "@/components/wv";
import { createClient } from "@/lib/supabase/server";

export default async function EmployerCandidatesPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const isEmployer = await hasRole("employer");

  if (!isEmployer) {
    redirect("/dashboard");
  }

  const supabase = await createClient();
  const { data: employerAccount } = await (supabase as any)
    .from("employer_accounts")
    .select("plan_tier")
    .eq("user_id", user.id)
    .maybeSingle();

  const planTier = String(
    (employerAccount as { plan_tier?: string } | null)?.plan_tier || "free"
  );

  return (
    <EmployerPortalLayout wide>
      <WvPageHeader
        eyebrow="Talent"
        title="Candidates"
        description="Imported ATS candidates and linked WorkVouch profiles in one place. Verified worker discovery remains on Verified candidates."
        action={
          <div className="flex flex-wrap gap-2">
            <WvButton href="/employer/search-users" variant="secondary" size="sm">
              Search
            </WvButton>
            <WvButton href="/employer/verified-workers" variant="ghost" size="sm">
              Verified candidates
            </WvButton>
          </div>
        }
      />
      <div className="mt-8">
        <EmployerCandidatesDirectoryClient planTier={planTier} />
      </div>
    </EmployerPortalLayout>
  );
}
