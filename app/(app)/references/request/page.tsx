import { getUserConnections } from "@/lib/actions/connections";
import { RequestReferenceForm } from "@/components/request-reference-form";

export const dynamic = "force-dynamic";

export default async function RequestReferencePage() {
  const connections = await getUserConnections();

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8 bg-background dark:bg-[#0D1117] min-h-screen">
      <h1 className="mb-6 text-3xl font-bold text-grey-dark dark:text-gray-200">
        Request Reference
      </h1>
      <RequestReferenceForm connections={connections || []} />
    </main>
  );
}
