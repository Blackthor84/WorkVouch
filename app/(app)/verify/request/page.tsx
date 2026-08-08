export const dynamic = "force-dynamic";

import { Suspense } from "react";
import VerifyRequestClient from "./VerifyRequestClient";
import { WvContainer, WvLoadingState } from "@/components/wv";

export default function VerifyRequestPage() {
  return (
    <WvContainer size="narrow" className="py-8">
      <Suspense
        fallback={
          <WvLoadingState label="Loading verification request…" fullPage />
        }
      >
        <VerifyRequestClient />
      </Suspense>
    </WvContainer>
  );
}
