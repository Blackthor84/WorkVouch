"use client";

import { useState, useEffect } from "react";

/** Fake integration panel for acquisition story mode: "This becomes a signal inside existing hiring workflows." */
const INTEGRATION_PANEL = {
  source: "WorkVouch API",
  destination: "ATS / HRIS",
  sync: "Real-time",
};

export function AcquisitionStoryPanel() {
  const [acquisitionMode, setAcquisitionMode] = useState(false);

  useEffect(() => {
    fetch("/api/admin/acquisition-mode", { credentials: "include" })
      .then((r) => r.json())
      .then((d: { acquisitionMode?: boolean }) => setAcquisitionMode(d?.acquisitionMode === true))
      .catch(() => setAcquisitionMode(false));
  }, []);

  if (!acquisitionMode) return null;

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
      <h4 className="font-semibold text-slate-800">Integration</h4>
      <dl className="mt-2 space-y-1 text-slate-600">
        <div className="flex gap-2">
          <dt className="font-medium">Source:</dt>
          <dd>{INTEGRATION_PANEL.source}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="font-medium">Destination:</dt>
          <dd>{INTEGRATION_PANEL.destination}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="font-medium">Sync:</dt>
          <dd>{INTEGRATION_PANEL.sync}</dd>
        </div>
      </dl>
      <p className="mt-2 text-xs text-slate-500">
        This becomes a signal inside existing hiring workflows.
      </p>
    </div>
  );
}

/** Label for trust score when acquisition mode is on: "Verified Employment Signal" instead of "Trust Score". */
export function getTrustScoreLabel(acquisitionMode: boolean): string {
  return acquisitionMode ? "Verified Employment Signal" : "Trust Score";
}
