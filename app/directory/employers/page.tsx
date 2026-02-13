import { redirect } from "next/navigation";
import { getSupabaseSession } from "@/lib/supabase/server";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { EmployersMarketplaceClient } from "@/components/directory/EmployersMarketplaceClient";

export const dynamic = "force-dynamic";

export default async function DirectoryEmployersPage() {
  const { session } = await getSupabaseSession();
  if (!session?.user) redirect("/login");

  const sb = getSupabaseServer() as any;
  const { data: flag } = await sb
    .from("feature_flags")
    .select("id, is_globally_enabled")
    .eq("key", "employer_reputation_marketplace")
    .maybeSingle();

  const enabled = (flag as { is_globally_enabled?: boolean } | null)?.is_globally_enabled === true;
  if (!enabled) {
    redirect("/directory");
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 bg-background dark:bg-[#0D1117] min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-grey-dark dark:text-gray-200 mb-2">Employer reputation marketplace</h1>
        <p className="text-grey-medium dark:text-gray-400">
          Employers ranked by reputation score. Filter by industry.
        </p>
      </div>
      <EmployersMarketplaceClient />
    </main>
  );
}
