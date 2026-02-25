export const dynamic = "force-dynamic";

import { Suspense } from "react";
import FixProfileClient from "./FixProfileClient";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading…</div>}>
      <FixProfileClient />
    </Suspense>
  );
}
