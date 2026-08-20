"use client";

import { useCallback, useEffect, useState } from "react";
import { WvButton, WvCard, WvInput, WvLoadingState, WvPageHeader } from "@/components/wv";
import { IntegrationSubNav, useConnectionId } from "./integration-nav";

const TRIGGERS = [
  { value: "application", label: "After application" },
  { value: "phone_screen", label: "After phone screen" },
  { value: "final_interview", label: "After final interview" },
  { value: "offer", label: "After offer" },
  { value: "hire", label: "After hire" },
  { value: "manual", label: "Manual only" },
];

export function AutomationSettingsClient({ defaultConnectionId }: { defaultConnectionId?: string }) {
  const connectionId = useConnectionId(defaultConnectionId);
  const [automation, setAutomation] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    if (!connectionId) return;
    setLoading(true);
    const res = await fetch(`/api/employer/integrations/connections/${connectionId}/settings`);
    if (res.ok) {
      const json = await res.json();
      setAutomation((json.automation as Record<string, unknown>) ?? {});
    }
    setLoading(false);
  }, [connectionId]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    if (!connectionId) return;
    setSaving(true);
    setSaved(false);
    const res = await fetch(`/api/employer/integrations/connections/${connectionId}/settings`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ automation }),
    });
    setSaving(false);
    if (res.ok) setSaved(true);
  };

  return (
    <>
      <WvPageHeader eyebrow="Integrations" title="Automation settings" description="Configure invite triggers, filters, delays, and manual override." />
      <IntegrationSubNav />

      {loading && <WvLoadingState label="Loading settings…" />}

      {!loading && connectionId && (
        <WvCard padding="lg" className="max-w-2xl space-y-6">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={automation.auto_invite_enabled !== false}
              onChange={(e) => setAutomation((a) => ({ ...a, auto_invite_enabled: e.target.checked }))}
            />
            <span>Enable auto-invite</span>
          </label>

          <div>
            <label className="mb-1 block text-sm text-wv-muted">Invite trigger</label>
            <select
              className="w-full rounded-xl border border-wv-border bg-wv-surface px-3 py-2"
              value={String(automation.auto_invite_trigger ?? "final_interview")}
              onChange={(e) => setAutomation((a) => ({ ...a, auto_invite_trigger: e.target.value }))}
            >
              {TRIGGERS.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <WvInput
            label="Delay (hours)"
            type="number"
            min={0}
            value={String(automation.auto_invite_delay_hours ?? 0)}
            onChange={(e) => setAutomation((a) => ({ ...a, auto_invite_delay_hours: Number(e.target.value) }))}
          />

          <div>
            <label className="mb-1 block text-sm text-wv-muted">Job filter mode</label>
            <select
              className="w-full rounded-xl border border-wv-border bg-wv-surface px-3 py-2"
              value={String(automation.job_filter_mode ?? "all")}
              onChange={(e) => setAutomation((a) => ({ ...a, job_filter_mode: e.target.value }))}
            >
              <option value="all">All jobs</option>
              <option value="selected">Selected jobs only</option>
              <option value="excluded">Exclude selected jobs</option>
            </select>
          </div>

          <WvInput
            label="Job IDs (comma-separated)"
            value={Array.isArray(automation.job_filter_ids) ? automation.job_filter_ids.join(", ") : ""}
            onChange={(e) =>
              setAutomation((a) => ({
                ...a,
                job_filter_ids: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
              }))
            }
          />

          <WvInput
            label="Department IDs (comma-separated)"
            value={Array.isArray(automation.department_filter_ids) ? automation.department_filter_ids.join(", ") : ""}
            onChange={(e) =>
              setAutomation((a) => ({
                ...a,
                department_filter_mode: a.department_filter_mode ?? "selected",
                department_filter_ids: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
              }))
            }
          />

          <WvInput
            label="Location countries (ISO-2, comma-separated)"
            value={Array.isArray(automation.location_filter) ? automation.location_filter.join(", ") : ""}
            onChange={(e) =>
              setAutomation((a) => ({
                ...a,
                location_filter_mode: a.location_filter_mode ?? "selected",
                location_filter: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
              }))
            }
          />

          <div className="flex items-center gap-3">
            <WvButton onClick={save} disabled={saving}>{saving ? "Saving…" : "Save settings"}</WvButton>
            {saved && <span className="text-sm text-emerald-400">Saved</span>}
          </div>
        </WvCard>
      )}
    </>
  );
}
