export const dynamic = "force-dynamic";

import { Suspense } from "react";
import ConstructionCareersClient from "./ConstructionCareersClient";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading…</div>}>
      <ConstructionCareersClient />
    </Suspense>
  );
}
