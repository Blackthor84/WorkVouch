"use client";

import { AlertCircle, RefreshCw } from "lucide-react";
import { ghPanel } from "./panel-theme";

interface PanelErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export function PanelErrorState({ message, onRetry }: PanelErrorStateProps) {
  return (
    <div
      className={`${ghPanel.card} ${ghPanel.cardPadding}`}
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-[#15372c]">Unable to load WorkVouch data</p>
          <p className="mt-1 text-xs text-[#5c6c66]">{message}</p>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className={`mt-3 inline-flex items-center gap-1.5 rounded-md border border-[#e1e6e4] px-3 py-1.5 text-xs font-medium text-[#15372c] hover:bg-[#f3f5f4] ${ghPanel.focusRing}`}
            >
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
              Try again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function PanelConnectionErrorState({ onRetry }: { onRetry?: () => void }) {
  return (
    <PanelErrorState
      message="Greenhouse connection may need attention. Cached data may be stale."
      onRetry={onRetry}
    />
  );
}
