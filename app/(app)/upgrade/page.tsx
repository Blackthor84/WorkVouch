import { Suspense } from "react";
import UpgradePageClient from "./UpgradePageClient";

// Mark as dynamic to prevent build-time prerendering
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default function UpgradePage() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Loading...</div>}>
      <UpgradePageClient />
    </Suspense>
  );
}
