import nextDynamic from "next/dynamic";
import { redirect } from "next/navigation";
import { getCurrentUser, isEmployer } from "@/lib/auth";
import { admin } from "@/lib/supabase-admin";

const EnterpriseSimulateClient = nextDynamic(() => import("@/components/enterprise/EnterpriseSimulateClient"), {
  ssr: false,
  loading: () => (
    <div className="max-w-7xl mx-auto px-4 py-16 text-center text-slate-500 text-sm">Loading hiring insights…</div>
  ),
});

export const dynamic = "force-dynamic";

export default async function EnterpriseSimulatePage(props: { params: Promise<{ userId: string }> }) {
  const user = await getCurrentUser();
  if (!user || !(await isEmployer())) {
    redirect("/login");
  }

  const { userId } = await props.params;
  if (!userId) redirect("/enterprise/dashboard");

  const { data: saved } = await admin
    .from("saved_candidates")
    .select("id")
    .eq("employer_id", user.id)
    .eq("candidate_id", userId)
    .maybeSingle();

  if (!saved) {
    redirect("/enterprise/dashboard");
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("full_name, industry, professional_summary")
    .eq("id", userId)
    .single();

  const { data: ts } = await admin
    .from("trust_scores")
    .select("score, reference_count, job_count")
    .eq("user_id", userId)
    .maybeSingle();

  const prof = profile as {
    full_name?: string | null;
    industry?: string | null;
    professional_summary?: string | null;
  } | null;

  const summary = prof?.professional_summary?.trim() ?? null;
  const roleHint = summary && summary.length > 120 ? `${summary.slice(0, 117)}…` : summary;

  return (
    <EnterpriseSimulateClient
      candidateId={userId}
      initial={{
        fullName: prof?.full_name?.trim() || "Candidate",
        industryLabel: prof?.industry ?? null,
        roleHint,
        trustScore: ts?.score != null ? Number(ts.score) : null,
        referenceCount: ts?.reference_count != null ? Number(ts.reference_count) : null,
        jobCount: ts?.job_count != null ? Number(ts.job_count) : null,
      }}
    />
  );
}
