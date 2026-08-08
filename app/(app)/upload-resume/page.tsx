import { UploadResumeForm } from "@/components/upload-resume-form";
import { WvCard, WvContainer, WvPageHeader } from "@/components/wv";

export default async function UploadResumePage() {
  return (
    <WvContainer size="narrow" className="py-8">
      <WvPageHeader
        eyebrow="Profile"
        title="Upload resume"
        description="Add a PDF, DOC, or DOCX (max 5 MB) to your profile. Employers can request access."
      />
      <WvCard padding="lg">
        <UploadResumeForm />
      </WvCard>
    </WvContainer>
  );
}
