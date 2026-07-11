import { redirect } from "next/navigation";
import { getCurrentUser, isEmployer } from "@/lib/auth";
import { EmployerPortalLayout } from "@/components/employer/EmployerPortalLayout";
import { CompareViewClient } from "./CompareViewClient";
import { WvPageHeader } from "@/components/wv";

export default async function ComparePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const userIsEmployer = await isEmployer();
  if (!userIsEmployer) redirect("/dashboard");

  return (
    <EmployerPortalLayout wide>
      <WvPageHeader
        eyebrow="Decisions"
        title="Compare candidates"
        description="Side-by-side view of verification, trust band, references, and flags. No raw scores are shown."
      />
      <div className="mt-8">
        <CompareViewClient />
      </div>
    </EmployerPortalLayout>
  );
}
