import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/**
 * Short invite URL (`/vouch/:token`) → canonical confirm flow.
 * SMS-friendly shorter path than `/vouch/confirm/:token`.
 */
export default async function VouchShortLinkPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const t = (token ?? "").trim();
  if (!t) {
    redirect("/");
  }
  // Avoid shadowing `/vouch/confirm/[token]` when someone hits `/vouch/confirm` only
  if (t === "confirm") {
    notFound();
  }
  redirect(`/vouch/confirm/${encodeURIComponent(t)}`);
}
