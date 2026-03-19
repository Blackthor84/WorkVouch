import { Card } from "@/components/ui/card";
import { UploadResumeForm } from "@/components/upload-resume-form";

export default async function UploadResumePage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 bg-background dark:bg-[#0D1117] min-h-screen">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-grey-dark dark:text-gray-200 mb-2">
            Upload Resume
          </h1>
          <p className="text-grey-medium dark:text-gray-400">
            Upload your resume (PDF, DOC, or DOCX, max 5MB) to store it on your profile. Employers can request access to view it.
          </p>
        </div>

        <Card className="p-6">
          <UploadResumeForm />
        </Card>
    </main>
  );
}
