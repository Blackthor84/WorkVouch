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

  const handleAccept = async () => {
    setAccepting(true);
    try {
      const res = await fetch("/api/employer/legal-acceptance", {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert((data as { error?: string }).error ?? "Failed to accept");
        return;
      }
      router.push(redirectPath);
    } finally {
      setAccepting(false);
    }
  };

  return (
    <EmployerLegalDisclaimerModal
      open={true}
      onAccept={handleAccept}
      accepting={accepting}
    />
  );
}
