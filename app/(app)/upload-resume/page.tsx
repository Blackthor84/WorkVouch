import { UploadResumeForm } from "@/components/upload-resume-form";
import { WvCard, WvContainer, WvPageHeader } from "@/components/wv";

export default async function UploadResumePage() {
  return (
    <WvContainer size="narrow" className="py-8">
      <WvPageHeader
        eyebrow="Profile"
        title="Upload Resume"
        description="Upload your resume (PDF, DOC, or DOCX, max 5MB) to store it on your profile. Employers can request access to view it."
      />
      <WvCard padding="lg">
        <UploadResumeForm />
      </WvCard>
    </WvContainer>
  );
}
