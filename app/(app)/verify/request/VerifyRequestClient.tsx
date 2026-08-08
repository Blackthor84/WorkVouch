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
        title="Request verification"
        description="Invite coworkers or managers to confirm your work history. Verified records increase your trust score."
      />
      <VerificationRequestModal
        open={true}
        onOpenChange={(open) => {
          if (!open) {
            if (typeof window !== "undefined" && window.history.length > 1) {
              router.back();
            } else {
              router.push("/dashboard");
            }
          }
        }}
        onSuccess={() => {}}
      />
    </>
  );
}
