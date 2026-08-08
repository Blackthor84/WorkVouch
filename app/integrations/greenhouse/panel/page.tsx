import { Suspense } from "react";
import { GreenhousePanelPageClient } from "./GreenhousePanelPageClient";

export const metadata = {
  title: "WorkVouch — Greenhouse Panel",
  description: "Embedded trust and verification panel for Greenhouse recruiters",
};

/** Iframe-embeddable Greenhouse recruiter panel. */
export default function GreenhousePanelPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f8f9fb]" role="status" aria-label="Loading panel" />}>
      <GreenhousePanelPageClient />
    </Suspense>
  );
}
