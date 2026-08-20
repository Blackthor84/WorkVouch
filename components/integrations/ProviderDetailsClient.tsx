"use client";

import { useCallback, useEffect, useState } from "react";
import { WvBadge, WvButton, WvCard, WvLoadingState, WvPageHeader } from "@/components/wv";
import { IntegrationSubNav, formatRelativeTime, statusBadgeVariant, useConnectionId } from "./integration-nav";
import { Download, CheckCircle2, AlertCircle } from "lucide-react";

interface BundleDownloadState {
  status: "idle" | "generating" | "success" | "error";
  sizeBytes?: number;
  generatedAt?: string;
  error?: string;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ProviderDetailsClient({ defaultConnectionId }: { defaultConnectionId?: string }) {
  const connectionId = useConnectionId(defaultConnectionId);
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [bundle, setBundle] = useState<BundleDownloadState>({ status: "idle" });

  const load = useCallback(async () => {
    if (!connectionId) return;
    setLoading(true);
    const res = await fetch(`/api/employer/integrations/connections/${connectionId}`);
    if (res.ok) setData(await res.json());
    setLoading(false);
  }, [connectionId]);

  useEffect(() => {
    void load();
  }, [load]);

  const disconnect = async () => {
    if (!connectionId || !confirm("Disconnect Greenhouse? Sync history is preserved.")) return;
    setBusy("disconnect");
    await fetch(`/api/employer/integrations/connections/${connectionId}`, { method: "DELETE" });
    window.location.href = "/employer/integrations";
  };

  const reconnect = async () => {
    if (!connectionId) return;
    setBusy("reconnect");
    const res = await fetch(`/api/employer/integrations/connections/${connectionId}/reconnect`, { method: "POST" });
    const json = await res.json();
    if (json.authorizationUrl) window.location.href = json.authorizationUrl;
    setBusy(null);
  };

  const downloadDiagnosticBundle = async () => {
    if (!connectionId) return;
    setBundle({ status: "generating" });
    try {
      const res = await fetch(
        `/api/employer/integrations/connections/${connectionId}/diagnostic-bundle?format=zip`
      );
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? "Failed to generate diagnostic bundle");
      }

      const sizeBytes = parseInt(res.headers.get("X-Bundle-Size-Bytes") ?? "0", 10);
      const generatedAt = res.headers.get("X-Bundle-Generated-At") ?? new Date().toISOString();
      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition") ?? "";
      const filenameMatch = disposition.match(/filename="([^"]+)"/);
      const filename = filenameMatch?.[1] ?? `workvouch-connect-diagnostic-${connectionId}.zip`;

      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      anchor.click();
      URL.revokeObjectURL(url);

      setBundle({ status: "success", sizeBytes: sizeBytes || blob.size, generatedAt });
    } catch (e) {
      setBundle({
        status: "error",
        error: e instanceof Error ? e.message : "Failed to generate diagnostic bundle",
      });
    }
  };

  const connection = data?.connection as Record<string, unknown> | undefined;
  const stats = data?.stats as Record<string, number> | undefined;
  const cursor = data?.cursor as Record<string, unknown> | undefined;

  return (
    <>
      <WvPageHeader
        eyebrow="Greenhouse"
        title="Provider details"
        description="Connection status, sync metrics, and quick actions."
        action={
          connectionId ? (
            <div className="flex gap-2">
              <WvButton variant="outline" size="sm" disabled={!!busy} onClick={reconnect}>Reconnect</WvButton>
              <WvButton variant="ghost" size="sm" disabled={!!busy} onClick={disconnect}>Disconnect</WvButton>
            </div>
          ) : undefined
        }
      />
      <IntegrationSubNav />

      {!connectionId && (
        <WvCard padding="md"><p className="text-wv-muted">Connect Greenhouse first from the connection wizard.</p></WvCard>
      )}

      {loading && connectionId && <WvLoadingState label="Loading provider…" />}

      {!loading && connection && (
        <div className="space-y-6">
          <WvCard padding="md">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-xl font-semibold">Greenhouse</h2>
              <WvBadge variant={statusBadgeVariant(String(connection.status))}>{String(connection.status)}</WvBadge>
              {connection.providerAccountName && (
                <span className="text-sm text-wv-muted">{String(connection.providerAccountName)}</span>
              )}
            </div>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-sm">
              <div><dt className="text-wv-subtle">Last sync</dt><dd>{formatRelativeTime(connection.lastSyncAt as string)}</dd></div>
              <div><dt className="text-wv-subtle">Health</dt><dd>{String(connection.lastHealthStatus ?? "unknown")}</dd></div>
              <div><dt className="text-wv-subtle">Token expires</dt><dd>{formatRelativeTime(connection.tokenExpiresAt as string)}</dd></div>
              <div><dt className="text-wv-subtle">Cursor position</dt><dd>{String(cursor?.lastSuccessfulSync ?? "—")}</dd></div>
              <div><dt className="text-wv-subtle">Events</dt><dd>{stats?.eventsProcessed ?? 0}</dd></div>
              <div><dt className="text-wv-subtle">Candidates</dt><dd>{stats?.candidatesImported ?? 0}</dd></div>
            </dl>
          </WvCard>

          <WvCard padding="md">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold">Support diagnostic bundle</h3>
                <p className="mt-1 text-sm text-wv-muted">
                  Download a portable bundle with health, sync history, events, and replay references.
                  Secrets are automatically redacted.
                </p>
              </div>
              <WvButton
                variant="outline"
                size="sm"
                disabled={bundle.status === "generating" || !!busy}
                onClick={downloadDiagnosticBundle}
              >
                <Download className="mr-2 h-4 w-4" />
                {bundle.status === "generating" ? "Generating…" : "Download Diagnostic Bundle"}
              </WvButton>
            </div>

            {bundle.status === "generating" && (
              <p className="mt-4 text-sm text-wv-muted">Collecting connection data and redacting secrets…</p>
            )}

            {bundle.status === "success" && (
              <div className="mt-4 flex items-center gap-2 text-sm text-emerald-400">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>
                  Bundle downloaded ({formatBytes(bundle.sizeBytes ?? 0)}) — generated{" "}
                  {formatRelativeTime(bundle.generatedAt)}
                </span>
              </div>
            )}

            {bundle.status === "error" && (
              <div className="mt-4 flex items-center gap-2 text-sm text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{bundle.error}</span>
              </div>
            )}
          </WvCard>
        </div>
      )}
    </>
  );
}
