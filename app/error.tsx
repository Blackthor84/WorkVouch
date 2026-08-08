"use client";

import { useEffect } from "react";
import { WvContainer, WvErrorState } from "@/components/wv";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <WvContainer className="py-16">
      <WvErrorState
        message={error.message || "An unexpected error occurred."}
        onRetry={() => reset()}
      />
    </WvContainer>
  );
}
