import type { Metadata } from "next";
import { loadPublicCoworkerInvitePreview, sanitizeInviteToken } from "@/lib/invites/publicCoworkerVouch";
import { VouchConfirmClient } from "./VouchConfirmClient";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token: raw } = await params;
  const token = sanitizeInviteToken(raw);
  if (!token) {
    return { title: "Invite | WorkVouch" };
  }
  const preview = await loadPublicCoworkerInvitePreview(token);
  if (!preview.ok) {
    return { title: "Invite | WorkVouch" };
  }
  return {
    title: `Vouch for ${preview.inviterName} | WorkVouch`,
    description: `Confirm if you worked with ${preview.inviterName} at ${preview.companyName}.`,
  };
}

/** Client loads invite via GET /api/get-invite?token=… and posts to /api/accept-invite */
export default async function VouchConfirmPage({ params }: { params: Promise<{ token: string }> }) {
  const { token: raw } = await params;
  const token = sanitizeInviteToken(raw) ?? "";
  return <VouchConfirmClient token={token} />;
}
