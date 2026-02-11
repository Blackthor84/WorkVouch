import { Card } from "@/components/ui/card";
import { VerticalControlClient } from "./VerticalControlClient";

export const dynamic = "force-dynamic";

export default function VerticalControlPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Vertical Control</h1>
        <p className="text-sm text-slate-300 mt-1">
          Enable or disable verticals. Disabled verticals hide onboarding fields, badges, and monetization upgrades; data is still stored.
        </p>
      </div>
      <VerticalControlClient />
    </div>
  );
}
