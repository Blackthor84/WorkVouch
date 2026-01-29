import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { UploadResumeForm } from "@/components/upload-resume-form";

export default async function UploadResumePage() {
  const user = await getCurrentUser();

  if (!user) {
    console.log("REDIRECT TRIGGERED IN: app/(app)/upload-resume/page.tsx");
    redirect("/auth/signin");
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 bg-background dark:bg-[#0D1117] min-h-screen">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-grey-dark dark:text-gray-200 mb-2">
            Upload Resume
          </h1>
          <p className="text-grey-medium dark:text-gray-400">
            Upload your resume (PDF or DOCX) to auto-fill your WorkVouch
            profile.
          </p>
        </div>

        <Card className="p-6">
          <UploadResumeForm />
        </Card>
    </main>
  );
}
