import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/**
 * Public route: /verify/[requestId]
 * Section 3 — Invitation link. requestId is the response_token from the verification request.
 * Redirects to the existing verification respond page so one flow handles both URLs.
 */
export default async function VerifyByRequestIdPage(props: {
  params: Promise<{ requestId: string }>;
}) {
  const { requestId } = await props.params;
  if (!requestId?.trim()) {
    redirect("/");
  }
  redirect(`/verification/respond/${encodeURIComponent(requestId.trim())}`);
}
