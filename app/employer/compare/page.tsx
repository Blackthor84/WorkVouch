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
        eyebrow="Compare"
        title="Compare candidates"
        description="Review verification, trust band, and references side by side. Select 2–4 profiles from search."
      />
      <div className="mt-8">
        <CompareViewClient />
      </div>
    </EmployerPortalLayout>
  );
}
