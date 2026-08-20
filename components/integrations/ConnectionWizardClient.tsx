"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  WvBadge,
  WvButton,
  WvCard,
  WvInput,
  WvLoadingState,
  WvPageHeader,
  WvSuccessState,
} from "@/components/wv";
import { IntegrationSubNav } from "./integration-nav";
import { CheckCircle2, Circle, Loader2 } from "lucide-react";

const STEPS = [
  { id: "provider", title: "Choose provider" },
  { id: "authorize", title: "Authorize OAuth" },
  { id: "validate", title: "Validate connection" },
  { id: "preview", title: "Import preview" },
  { id: "automation", title: "Enable automation" },
  { id: "finish", title: "Finish" },
];

export function ConnectionWizardClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const stepParam = searchParams.get("step") ?? "provider";
  const connectionId = searchParams.get("connectionId") ?? "";
  const connected = searchParams.get("connected");
  const error = searchParams.get("error");

  const [activeStep, setActiveStep] = useState(stepParam);
  const [authorizing, setAuthorizing] = useState(false);
  const [importResult, setImportResult] = useState<Record<string, unknown> | null>(null);
  const [importing, setImporting] = useState(false);
  const [automation, setAutomation] = useState({
    auto_invite_enabled: true,
    auto_invite_trigger: "final_interview",
    auto_invite_delay_hours: 0,
  });

  useEffect(() => {
    if (connected === "greenhouse" && connectionId) {
      setActiveStep("validate");
    }
  }, [connected, connectionId]);

  const startOAuth = async () => {
    setAuthorizing(true);
    try {
      const res = await fetch("/api/employer/integrations/connect/greenhouse", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "OAuth failed");
      window.location.href = data.authorizationUrl;
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to start OAuth");
      setAuthorizing(false);
    }
  };

  const runPreviewImport = useCallback(async () => {
    if (!connectionId) return;
    setImporting(true);
    try {
      const res = await fetch(`/api/employer/integrations/connections/${connectionId}/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ maxPages: 1 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Import failed");
      setImportResult(data);
      setActiveStep("automation");
    } catch (e) {
      alert(e instanceof Error ? e.message : "Import preview failed");
    } finally {
      setImporting(false);
    }
  }, [connectionId]);

  useEffect(() => {
    if (activeStep === "preview" && connectionId && !importResult) {
      void runPreviewImport();
    }
  }, [activeStep, connectionId, importResult, runPreviewImport]);

  const saveAutomation = async () => {
    if (!connectionId) return;
    await fetch(`/api/employer/integrations/connections/${connectionId}/settings`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ automation }),
    });
    setActiveStep("finish");
  };

  const stepIndex = STEPS.findIndex((s) => s.id === activeStep);

  return (
    <>
      <WvPageHeader
        eyebrow="Integrations"
        title="Connection wizard"
        description="Connect Greenhouse in six steps. You can change automation settings anytime."
      />
      <IntegrationSubNav />

      {error && (
        <WvCard className="mb-6 border-red-500/30 bg-red-500/5 p-4 text-red-300">
          Connection error: {error}
        </WvCard>
      )}

      <div className="mb-8 flex flex-wrap gap-3">
        {STEPS.map((step, i) => (
          <div key={step.id} className="flex items-center gap-2 text-sm">
            {i < stepIndex ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400" aria-hidden />
            ) : i === stepIndex ? (
              <Loader2 className="h-4 w-4 animate-spin text-violet-400" aria-hidden />
            ) : (
              <Circle className="h-4 w-4 text-wv-subtle" aria-hidden />
            )}
            <span className={i <= stepIndex ? "text-wv-foreground" : "text-wv-muted"}>{step.title}</span>
          </div>
        ))}
      </div>

      <WvCard padding="lg" className="max-w-2xl">
        {activeStep === "provider" && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Choose your ATS provider</h2>
            <p className="text-wv-muted">WorkVouch Connect supports Greenhouse today. More providers coming soon.</p>
            <WvCard padding="md" hover className="cursor-pointer border-violet-500/30" onClick={() => setActiveStep("authorize")}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">Greenhouse</p>
                  <p className="text-sm text-wv-muted">Sync candidates, jobs, and applications</p>
                </div>
                <WvBadge variant="brand">Recommended</WvBadge>
              </div>
            </WvCard>
            <WvButton onClick={() => setActiveStep("authorize")}>Continue</WvButton>
          </div>
        )}

        {activeStep === "authorize" && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Authorize with Greenhouse</h2>
            <ul className="list-inside list-disc space-y-1 text-sm text-wv-muted">
              <li>Read candidates, jobs, and applications</li>
              <li>Receive real-time webhook events</li>
              <li>WorkVouch never modifies your Greenhouse data</li>
            </ul>
            <WvButton onClick={startOAuth} disabled={authorizing}>
              {authorizing ? "Redirecting…" : "Continue to Greenhouse →"}
            </WvButton>
          </div>
        )}

        {activeStep === "validate" && (
          <div className="space-y-4">
            <WvSuccessState title="Connected to Greenhouse" message={`Connection ID: ${connectionId}`} />
            <p className="text-sm text-wv-muted">OAuth tokens stored securely. Webhooks will process automatically.</p>
            <WvButton onClick={() => setActiveStep("preview")}>Run import preview</WvButton>
          </div>
        )}

        {activeStep === "preview" && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Import preview</h2>
            {importing && <WvLoadingState label="Running preview import…" />}
            {importResult && (
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div><dt className="text-wv-subtle">Jobs</dt><dd className="font-medium">{String(importResult.jobsImported ?? 0)}</dd></div>
                <div><dt className="text-wv-subtle">Candidates</dt><dd className="font-medium">{String(importResult.candidatesImported ?? 0)}</dd></div>
                <div><dt className="text-wv-subtle">Applications</dt><dd className="font-medium">{String(importResult.applicationsImported ?? 0)}</dd></div>
                <div><dt className="text-wv-subtle">Events stored</dt><dd className="font-medium">{String(importResult.eventsStored ?? 0)}</dd></div>
              </dl>
            )}
          </div>
        )}

        {activeStep === "automation" && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Enable automation</h2>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={automation.auto_invite_enabled}
                onChange={(e) => setAutomation((a) => ({ ...a, auto_invite_enabled: e.target.checked }))}
              />
              Auto-invite candidates
            </label>
            <div>
              <label className="mb-1 block text-sm text-wv-muted">Invite trigger</label>
              <select
                className="w-full rounded-xl border border-wv-border bg-wv-surface px-3 py-2 text-sm"
                value={automation.auto_invite_trigger}
                onChange={(e) => setAutomation((a) => ({ ...a, auto_invite_trigger: e.target.value }))}
              >
                <option value="application">After application</option>
                <option value="phone_screen">After phone screen</option>
                <option value="final_interview">After final interview</option>
                <option value="offer">After offer</option>
                <option value="hire">After hire</option>
                <option value="manual">Manual only</option>
              </select>
            </div>
            <WvInput
              label="Delay (hours)"
              type="number"
              min={0}
              value={String(automation.auto_invite_delay_hours)}
              onChange={(e) => setAutomation((a) => ({ ...a, auto_invite_delay_hours: Number(e.target.value) }))}
            />
            <WvButton onClick={saveAutomation}>Save & continue</WvButton>
          </div>
        )}

        {activeStep === "finish" && (
          <div className="space-y-4">
            <WvSuccessState
              title="Integration ready"
              message="Greenhouse is connected and automation is configured. Monitor health from the dashboard."
            />
            <WvButton
              onClick={() => router.push(`/employer/integrations/greenhouse?connectionId=${connectionId}`)}
            >
              Go to provider details
            </WvButton>
          </div>
        )}
      </WvCard>
    </>
  );
}
