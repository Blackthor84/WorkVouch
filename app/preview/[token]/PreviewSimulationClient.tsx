"use client";

import { useEffect } from "react";
import { usePreview } from "@/lib/preview-context";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

type Props = {
  previewRole: string;
  previewPlan: string;
  previewFeatures: Record<string, boolean>;
};

/**
 * Read-only simulated dashboard for shareable preview links.
 * No DB writes, no Stripe, no impersonation, no admin APIs.
 */
export default function PreviewSimulationClient({ previewRole, previewPlan, previewFeatures }: Props) {
  const { setPreview } = usePreview();

  useEffect(() => {
    setPreview({
      demoActive: true,
      role: previewRole,
      subscription: previewPlan,
      previewRole: previewRole as "user" | "employer" | "admin",
      previewPlanTier: previewPlan,
      previewFeatures,
      featureFlags: Object.keys(previewFeatures).filter((k) => previewFeatures[k]),
    });
    return () => setPreview(null);
  }, [previewRole, previewPlan, previewFeatures, setPreview]);

  return (
    <>
      <div className="sticky top-0 z-50 border-b border-amber-500/40 bg-amber-500/10 px-4 py-3 text-center">
        <span className="text-sm font-semibold uppercase tracking-wider text-amber-400">
          Preview mode — read-only simulation. No real data or payments.
        </span>
      </div>
      <div className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold text-white">WorkVouch Preview</h1>
        <Card className="border-slate-700 bg-slate-900/80">
          <CardHeader>
            <h2 className="text-lg font-semibold text-slate-200">Simulated context</h2>
          </CardHeader>
          <CardContent className="space-y-2 text-slate-300">
            <p><strong>Role:</strong> {previewRole}</p>
            <p><strong>Plan:</strong> {previewPlan}</p>
            <p><strong>Features:</strong> {Object.keys(previewFeatures).filter((k) => previewFeatures[k]).join(", ") || "—"}</p>
            <p className="mt-4 text-sm text-slate-500">
              This is a sandbox. DB writes, payments, and admin APIs are disabled.
            </p>
          </CardContent>
        </Card>
        <Card className="mt-6 border-slate-700 bg-slate-900/80">
          <CardHeader>
            <h2 className="text-lg font-semibold text-slate-200">Simulated metrics</h2>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <p className="text-xs text-slate-400">Verifications (sim)</p>
                <p className="text-xl font-bold text-emerald-400">—</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Searches (sim)</p>
                <p className="text-xl font-bold text-slate-200">—</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Plan tier</p>
                <p className="text-xl font-bold text-slate-200">{previewPlan}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Risk score (sim)</p>
                <p className="text-xl font-bold text-slate-200">—</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
