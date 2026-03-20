import Link from "next/link";
import { getUserConnections } from "@/lib/actions/connections";
import { RequestReferenceForm } from "@/components/request-reference-form";

export const dynamic = "force-dynamic";

export default async function RequestReferencePage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const { from } = await searchParams;
  const fromOnboarding = from === "onboarding";
  const connections = await getUserConnections();

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8 bg-background dark:bg-[#0D1117] min-h-screen">
      {fromOnboarding && (
        <div className="mb-6 rounded-2xl border border-blue-200 bg-blue-50/90 dark:border-blue-800 dark:bg-blue-950/40 px-4 py-3">
          <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">Guided setup — get your first review</p>
          <p className="text-xs text-blue-800/90 dark:text-blue-200/90 mt-1">
            Send a reference request. When someone leaves you a review, your trust score can take off.
          </p>
          <Link
            href="/onboarding?celebrate=review"
            className="mt-2 inline-flex text-sm font-bold text-blue-700 hover:text-blue-800 dark:text-blue-300"
          >
            Back to setup checklist →
          </Link>
        </div>
      )}
      <h1 className="mb-6 text-3xl font-bold text-grey-dark dark:text-gray-200">
        Request Reference
      </h1>
      <RequestReferenceForm connections={connections || []} />
    </main>
  );
}
