import { notFound } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { TrustBadge } from "@/components/trust/TrustBadge";

export const dynamic = "force-dynamic";

/**
 * Embeddable badge page for iframe: /trust/[profileId]/badge
 * Renders only the TrustBadge component. No private data.
 */
export default async function TrustBadgePage(props: {
  params: Promise<{ profileId: string }>;
}) {
  const { profileId } = await props.params;
  if (!profileId?.trim()) notFound();

  const sb = getSupabaseServer();
  const { data: profile } = await sb
    .from("profiles")
    .select("id")
    .eq("id", profileId.trim())
    .maybeSingle();

  if (!profile) notFound();

  return (
    <main className="min-h-screen bg-transparent flex items-center justify-center p-4">
      <div className="inline-block">
        <TrustBadge profileId={profileId.trim()} embed />
      </div>
    </main>
  );
}
