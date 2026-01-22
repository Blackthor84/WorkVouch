import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import {
  findPotentialCoworkers,
  initiateConnection,
} from "@/lib/actions/connections";
import { NavbarServer } from "@/components/navbar-server";
import { CoworkerList } from "@/components/coworker-list";

export default async function CoworkersPage({
  params,
}: {
  params: { jobId: string };
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/auth/signin");
  }

  const potentialCoworkers = await findPotentialCoworkers(params.jobId);

  return (
    <>
      <NavbarServer />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 bg-background dark:bg-[#0D1117] min-h-screen">
        <h1 className="mb-6 text-3xl font-bold text-grey-dark dark:text-gray-200">
          Potential Coworkers
        </h1>
        <CoworkerList
          potentialCoworkers={potentialCoworkers}
          jobId={params.jobId}
        />
      </main>
    </>
  );
}
