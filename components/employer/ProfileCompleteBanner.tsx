"use client";

import { useState, useEffect } from "react";
import { ProfileCompleteGate } from "@/components/employer/ProfileCompleteGate";

/**
 * Fetches employer profile completion and shows ProfileCompleteGate when incomplete.
 * Used on candidate search and other pages where a complete profile improves access.
 */
export function ProfileCompleteBanner({ feature }: { feature: string }) {
  const [loading, setLoading] = useState(true);
  const [complete, setComplete] = useState(true);

  useEffect(() => {
    fetch("/api/employer/me", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (!data?.employer) {
          setComplete(true);
          return;
        }
        const e = data.employer;
        const name = !!(e.companyName && e.companyName.trim().length >= 2);
        const industry = !!(e.industryType && String(e.industryType).trim());
        const verification = !!e.claimVerified;
        setComplete(!!(name && industry && verification));
      })
      .catch(() => setComplete(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading || complete) return null;
  return <ProfileCompleteGate feature={feature} className="mb-6" />;
}
