"use client";

import { AlertTriangle, Wifi, WifiOff } from "lucide-react";
import type { PanelLinkStatus } from "@/lib/integrations/greenhouse/panel/types";
import { formatPanelRelativeTime, ghPanel } from "./panel-theme";

interface ConnectionBannerProps {
  linkStatus: PanelLinkStatus;
  connectionHealthy: boolean;
  lastSyncedAt: string | null;
  onReconnect?: () => void;
}

export function ConnectionBanner({
  linkStatus,
  connectionHealthy,
  lastSyncedAt,
  onReconnect,
}: ConnectionBannerProps) {
  if (linkStatus === "not_linked") return null;

  const stale = linkStatus === "stale" || !connectionHealthy;
  const error = linkStatus === "error";

  if (!stale && !error) {
    return (
      <div
        className="flex items-center gap-2 px-4 py-2 text-xs text-[#5c6c66]"
        role="status"
        aria-label={`Synced ${formatPanelRelativeTime(lastSyncedAt)}`}
      >
        <Wifi className="h-3.5 w-3.5 text-[#047957]" aria-hidden="true" />
        <span>Synced {formatPanelRelativeTime(lastSyncedAt)}</span>
      </div>
    );
  }

  return (
    <div
      className={`mx-4 mb-2 flex items-start gap-2 rounded-md border px-3 py-2 ${
        error ? "border-red-200 bg-red-50" : "border-amber-200 bg-amber-50"
      }`}
      role="alert"
    >
      {error ? (
        <WifiOff className="mt-0.5 h-4 w-4 shrink-0 text-red-600" aria-hidden="true" />
      ) : (
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden="true" />
      )}
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-[#15372c]">
          {error ? "Connection error" : "Data may be stale"}
        </p>
        <p className="text-xs text-[#5c6c66]">
          Last sync {formatPanelRelativeTime(lastSyncedAt)}.
          {onReconnect && (
            <>
              {" "}
              <button
                type="button"
                onClick={onReconnect}
                className={`font-medium text-[#047957] underline-offset-2 hover:underline ${ghPanel.focusRing}`}
              >
                Reconnect Greenhouse
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
