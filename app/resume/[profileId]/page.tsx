import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

/**
 * Route: /resume/[profileId]
 * Namespace for resume-related views by profile. Extend with resume viewer when needed.
 */
export default async function ResumeByProfilePage(props: {
  params: Promise<{ profileId: string }>;
}) {
  const { profileId } = await props.params;
  if (!profileId?.trim()) notFound();

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-6">
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-8 max-w-md w-full text-center">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-gray-100 mb-2">
          Resume
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
          Resume view for this profile is available to authorized users.
        </p>
        <Link href={`/trust/${profileId}`}>
          <Button variant="secondary">View trust profile</Button>
        </Link>
      </div>
    </main>
  );
}
