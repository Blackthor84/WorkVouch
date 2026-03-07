import { redirect } from "next/navigation";
import { getCurrentUser, hasRole } from "@/lib/auth";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TrustGraph } from "@/components/trust/TrustGraph";

export const dynamic = "force-dynamic";

export default async function TrustGraphPage(props: {
  params: Promise<{ candidateId: string }>;
}) {
  const { candidateId } = await props.params;
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const isEmployer = await hasRole("employer");
  if (!isEmployer) {
    redirect("/dashboard");
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center gap-4">
        <Link href={`/employer/candidates/${candidateId}`}>
          <Button variant="ghost" size="sm">
            ← Back to candidate
          </Button>
        </Link>
      </div>
      <h1 className="text-2xl font-bold text-[#0F172A] dark:text-gray-100 mb-2">
        Verification Network
      </h1>
      <p className="text-sm text-slate-600 dark:text-gray-400 mb-6">
        Verification relationships between the candidate and coworkers or managers. Blue = candidate, green = manager, gray = coworker.
      </p>
      <TrustGraph candidateId={candidateId} />
    </div>
  );
}
