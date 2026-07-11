export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { RequestsPageClient } from "./RequestsPageClient";
import { RequestCardSkeleton } from "@/components/workvouch/RequestCardSkeleton";
import { WvContainer, WvPageHeader } from "@/components/wv";

export default function RequestsPage() {
  return (
    <WvContainer size="narrow" className="py-8">
      <WvPageHeader
        eyebrow="References"
        title="Reference Requests"
        description="Incoming requests you can accept or decline. Outgoing requests show status."
      />
      <Suspense fallback={<RequestListSkeleton />}>
        <RequestsPageClient />
      </Suspense>
    </WvContainer>
  );
}

function RequestListSkeleton() {
  return (
    <ul className="mt-6 space-y-3">
      {[1, 2, 3].map((i) => (
        <RequestCardSkeleton key={i} />
      ))}
    </ul>
  );
}
