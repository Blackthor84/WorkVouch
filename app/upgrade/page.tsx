import UpgradePageClient from "./UpgradePageClient";

// Mark as dynamic to prevent build-time prerendering
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default function UpgradePage() {
  return <UpgradePageClient />;
}
