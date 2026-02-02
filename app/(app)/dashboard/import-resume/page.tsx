import { Card } from "@/components/ui/card";
import { ImportResumeClient } from "./ImportResumeClient";

export const dynamic = "force-dynamic";

export default function ImportResumePage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8 bg-background dark:bg-[#0D1117] min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Import resume
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Upload your resume, review the extracted employment history, then confirm to add it to your profile and trigger coworker matching.
        </p>
      </div>
      <ImportResumeClient />
    </main>
  );
}
