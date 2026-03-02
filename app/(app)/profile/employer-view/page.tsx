import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getMyProfileAsEmployerSeesIt } from "@/lib/actions/employer/candidate-search";
import { CandidateProfileViewer } from "@/components/employer/candidate-profile-viewer";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

export const revalidate = 0;
export const dynamic = "force-dynamic";

/**
 * Employee-facing "View My Profile as an Employer" page.
 * Reuses the exact employer profile payload and viewer so data matches byte-for-byte.
 */
export default async function EmployerViewPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const candidateData = await getMyProfileAsEmployerSeesIt();

  return (
    <div className="flex-1 flex flex-col container mx-auto px-4 py-8 md:py-12 min-w-0 bg-background dark:bg-[#0D1117]">
      <div className="mb-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/profile" className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200">
            <ArrowLeftIcon className="h-4 w-4" />
            Back to My Profile
          </Link>
        </Button>
      </div>
      <div className="max-w-4xl mx-auto w-full">
        <CandidateProfileViewer candidateData={candidateData} isEmployeeSelfView />
      </div>
    </div>
  );
}
