import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { getTrustScore } from "@/lib/trust/getTrustScore";

export const dynamic = "force-dynamic";

export default async function PublicTrustPage(props: {
  params: Promise<{ profileId: string }>;
}) {
  const { profileId } = await props.params;
  if (!profileId?.trim()) notFound();

  const sb = getSupabaseServer();
  const { data: profile } = await sb
    .from("profiles")
    .select("id, full_name")
    .eq("id", profileId.trim())
    .maybeSingle();

  if (!profile) notFound();

  const name = (profile as { full_name?: string }).full_name ?? "—";
  const { trustScore, verificationCount } = await getTrustScore(profileId.trim());

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-6">
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-8 max-w-md w-full text-center">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-gray-100 mb-2">
          Verified by WorkVouch
        </h1>
        <p className="text-lg font-medium text-slate-700 dark:text-gray-300 mb-6">
          {name}
        </p>
        <div className="mb-2">
          <span className="text-4xl font-bold text-blue-600 dark:text-blue-400">
            {trustScore}
          </span>
          <span className="text-slate-500 dark:text-slate-400 ml-1">/ 100</span>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
          Trust Score
        </p>
        <p className="text-slate-700 dark:text-gray-300 mb-8">
          Total Confirmations: <strong>{verificationCount}</strong>
        </p>
        <Link href={`/employer/trust-graph/${profileId}`}>
          <Button variant="secondary" className="w-full sm:w-auto">
            View Verification Network
          </Button>
        </Link>
      </div>
    </main>
  );
}
