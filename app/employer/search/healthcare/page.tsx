import { HealthcareSearchClient } from "./healthcare-search-client";
import { EmployerPortalLayout } from "@/components/employer/EmployerPortalLayout";
import { WvPageHeader } from "@/components/wv";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default function HealthcareSearchPage() {
  return (
    <EmployerPortalLayout>
      <WvPageHeader
        eyebrow="Healthcare"
        title="Search Healthcare Candidates"
        description="Filter by role, work setting, certifications, and experience."
      />
      <div className="mt-8">
        <HealthcareSearchClient />
      </div>
    </EmployerPortalLayout>
  );
}
