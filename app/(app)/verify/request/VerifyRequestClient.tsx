"use client";

import { useRouter } from "next/navigation";
import { VerificationRequestModal } from "@/components/verification/VerificationRequestModal";
import { WvPageHeader } from "@/components/wv";

export default function VerifyRequestClient() {
  const router = useRouter();

  return (
    <>
      <WvPageHeader
        eyebrow="Verification"
        title="Request employment verification"
        description="Invite coworkers, managers, or clients to confirm your work history. Verified records strengthen your trust score and help employers hire with confidence."
      />
      <VerificationRequestModal
        open={true}
        onOpenChange={(open) => {
          if (!open) router.push("/dashboard");
        }}
        onSuccess={() => {}}
      />
    </>
  );
}
