"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { EmployerLegalDisclaimerModal } from "@/components/employer/EmployerLegalDisclaimerModal";

export interface EmployerLegalDisclaimerGateProps {
  /** After acceptance, navigate to this path (e.g. profile or candidates list). */
  redirectPath: string;
}

/**
 * Full-page gate that shows the employer legal disclaimer modal.
 * Used when a server-rendered profile view is blocked by missing acceptance.
 * On accept, records acceptance then redirects to redirectPath.
 */
export function EmployerLegalDisclaimerGate({
  redirectPath,
}: EmployerLegalDisclaimerGateProps) {
  const router = useRouter();
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAccept = async () => {
    setAccepting(true);
    setError(null);
    try {
      const res = await fetch("/api/employer/legal-acceptance", {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError((data as { error?: string }).error ?? "Failed to accept terms");
        return;
      }
      router.push(redirectPath);
    } finally {
      setAccepting(false);
    }
  };

  return (
    <>
      {error && (
        <p className="mb-4 text-center text-sm text-red-400" role="alert">
          {error}
        </p>
      )}
      <EmployerLegalDisclaimerModal
        open={true}
        onAccept={handleAccept}
        accepting={accepting}
      />
    </>
  );
}
