import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/**
 * Route: /graph/[profileId]
 * Namespace for graph/network views by profile. Employers use /employer/trust-graph/[candidateId] for the full verification network.
 */
export default async function GraphByProfilePage(props: {
  params: Promise<{ profileId: string }>;
}) {
  const { profileId } = await props.params;
  if (!profileId?.trim()) {
    redirect("/");
  }
  redirect(`/employer/trust-graph/${encodeURIComponent(profileId.trim())}`);
}
