import { requireEnterpriseOwner } from "@/lib/enterprise/requireEnterprise";
import { WvPageHeader } from "@/components/wv";

export const dynamic = "force-dynamic";

export default async function ResumeImportsPage({ params }: { params: Promise<{ orgId: string }> }) {
  await requireEnterpriseOwner((await params).orgId);
  return (
    <div className="max-w-4xl space-y-6">
      <WvPageHeader
        eyebrow="Imports"
        title="Resume Imports"
        description="CSV upload, resume upload (PDF/DOCX), bulk invite. Pipeline: extract → parse → store → overlap detection."
      />
    </div>
  );
}
