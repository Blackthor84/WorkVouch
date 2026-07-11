import { Suspense } from "react";
import { EmployerPortalLayout } from "@/components/employer/EmployerPortalLayout";
import UpgradeClient from "./UpgradeClient";

export default function UpgradePage() {
  return (
    <EmployerPortalLayout>
      <Suspense fallback={<div className="text-wv-muted py-8">Loading upgrade…</div>}>
        <UpgradeClient />
      </Suspense>
    </EmployerPortalLayout>
  );
}
