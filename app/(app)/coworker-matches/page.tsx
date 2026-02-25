export const dynamic = "force-dynamic";

import { Suspense } from "react";
import CoworkerMatchesClient from "./CoworkerMatchesClient";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading…</div>}>
      <CoworkerMatchesClient />
    </Suspense>
  );
}
