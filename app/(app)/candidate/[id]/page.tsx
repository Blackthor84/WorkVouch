import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCandidateProfile, resolveCandidateId } from "@/lib/actions/employer/getCandidateProfile";
import { canViewCandidateProfile } from "@/lib/actions/employer/employerDashboardStats";
import { CandidateProfileView } from "./CandidateProfileView";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function CandidatePage({ params }: Props) {
  const { id: param } = await params;
  const candidateId = await resolveCandidateId(param);
  if (!candidateId) notFound();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: viewerProfile } = await supabase
    .from("profiles")
    .select("role, is_premium")
    .eq("id", user.id)
    .single();

  const role = (viewerProfile as { role?: string } | null)?.role ?? null;
  const isPremium = (viewerProfile as { is_premium?: boolean } | null)?.is_premium ?? false;

  const candidate = await getCandidateProfile(candidateId);
  if (!candidate) notFound();

  const viewLimit = await canViewCandidateProfile();
  const locked = role === "employer" && !isPremium && !viewLimit.allowed;

  return (
    <CandidateProfileView
      candidate={candidate}
      candidateId={candidateId}
      viewerIsEmployer={role === "employer"}
      viewerIsPremium={isPremium}
      locked={locked}
      viewsToday={viewLimit.viewsToday}
      viewLimit={viewLimit.limit}
    />
  );
}
