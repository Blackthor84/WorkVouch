"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { VerificationRequestModal } from "@/components/verification/VerificationRequestModal";

export default function VerifyRequestClient() {
  const router = useRouter();

  useEffect(() => {
    // Ensure we're in a state where modal can open
  }, []);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-start p-6">
      <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
        Send Verification Request
      </h1>
      <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 text-center max-w-md">
        Choose email, text message, or both to invite coworkers, managers, or clients to confirm your work history.
      </p>
      <VerificationRequestModal
        open={true}
        onOpenChange={(open) => {
          if (!open) router.push("/dashboard");
        }}
        onSuccess={() => {}}
      />
    </div>
  );
}
