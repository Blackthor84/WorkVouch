import { redirect } from "next/navigation";
import { getCurrentUser, hasRole } from "@/lib/auth";
import { EmployerPortalLayout } from "@/components/employer/EmployerPortalLayout";
import { WvCard, WvButton, WvPageHeader } from "@/components/wv";

export default async function EmployerJobPostsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const isEmployer = await hasRole("employer");

  if (!isEmployer) {
    redirect("/dashboard");
  }

  return (
    <EmployerPortalLayout>
      <WvPageHeader eyebrow="Jobs" title="Job posts" description="WorkVouch verifies work history — it does not host job listings. Search candidates instead." />
      <WvCard glow className="mt-8 text-center max-w-lg mx-auto">
        <h2 className="text-xl font-semibold text-wv-foreground mb-2">
          Verification, not job boards
        </h2>
        <p className="text-wv-muted mb-4">
          Search verified candidates and request employment verification from their profiles.
        </p>
        <WvButton href="/employer/search-users" variant="secondary">
          Search candidates
        </WvButton>
      </WvCard>
    </EmployerPortalLayout>
  );
}
