export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { IncomingRequestsClient } from "./IncomingRequestsClient";
import { RequestCardSkeleton } from "@/components/workvouch/RequestCardSkeleton";

export default function RequestsPage() {
  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
        Incoming Requests
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Reference requests from your network. Accept or reject below.
      </p>
      <Suspense fallback={<RequestListSkeleton />}>
        <IncomingRequestsClient />
      </Suspense>
    </div>
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
