"use client";

import { useState, useEffect } from "react";
import UpgradeModal from "./UpgradeModal";

interface VerificationLimitCheckProps {
  employerId: string;
  onLimitReached?: () => void;
  children: (canProceed: boolean) => React.ReactNode;
}

export function VerificationLimitCheck({
  employerId,
  onLimitReached,
  children,
}: VerificationLimitCheckProps) {
  const [canVerify, setCanVerify] = useState<boolean | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [limitInfo, setLimitInfo] = useState<{
    currentCount: number;
    limit: number;
    message?: string;
  } | null>(null);

  useEffect(() => {
    async function checkLimit() {
      try {
        const response = await fetch(
          `/api/employer/verification-limit?employerId=${employerId}`,
        );
        if (response.ok) {
          const data = await response.json();
          setCanVerify(data.canVerify);
          setLimitInfo({
            currentCount: data.currentCount,
            limit: data.limit,
            message: data.message,
          });

          if (!data.canVerify) {
            setShowModal(true);
            onLimitReached?.();
          }
        } else {
          // If check fails, allow proceeding (fail open)
          setCanVerify(true);
        }
      } catch (error) {
        console.error("Error checking verification limit:", error);
        // Fail open - allow proceeding if check fails
        setCanVerify(true);
      }
    }

    if (employerId) {
      checkLimit();
    }
  }, [employerId, onLimitReached]);

  if (canVerify === null) {
    return <div>Checking verification limit...</div>;
  }

  return (
    <>
      {showModal && (
        <UpgradeModal
          feature={`More Verifications (${limitInfo?.currentCount || 0}/${limitInfo?.limit || 10} used this month)`}
          onClose={() => setShowModal(false)}
        />
      )}
      {children(canVerify)}
    </>
  );
}
