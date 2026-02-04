"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Employer {
  id: string;
  company_name: string;
}

interface Snapshot {
  reputation_score: number;
  verification_integrity_score: number;
  dispute_ratio_score: number;
  rehire_confirmation_score: number;
  worker_retention_score: number;
  response_time_score: number;
  workforce_risk_score: number;
  fraud_flag_score: number;
  network_trust_score: number;
  compliance_score: number;
  last_calculated_at: string | null;
}

export function EmployerReputationPreviewClient() {
  const [employers, setEmployers] = useState<Employer[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [previewActive, setPreviewActive] = useState(false);
  const [previewExpires, setPreviewExpires] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/employers-list", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.employers)) setEmployers(data.employers);
      })
      .catch(() => setEmployers([]));
  }, []);

  const loadReputation = async () => {
    if (!selectedId) return;
    setLoading(true);
    setSnapshot(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/employer-reputation?employer_id=${encodeURIComponent(selectedId)}`, { credentials: "include" });
      const data = await res.json();
      if (res.ok && data.snapshot) setSnapshot(data.snapshot);
      else if (!res.ok) setMessage(data.error ?? "Failed to load");
    } catch {
      setMessage("Request failed");
    } finally {
      setLoading(false);
    }
  };

  const generatePreview = async () => {
    if (!selectedId) return;
    setMessage(null);
    try {
      const res = await fetch("/api/admin/employer-reputation-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employer_id: selectedId }),
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPreviewActive(true);
        setPreviewExpires(data.expires_at ?? null);
        setMessage("10-minute preview active. Synthetic data will expire at " + (data.expires_at ? new Date(data.expires_at).toLocaleString() : "in 10 min"));
      } else setMessage(data.error ?? "Failed to generate preview");
    } catch {
      setMessage("Request failed");
    }
  };

  return (
    <Card className="p-6">
      <div className="mb-4">
        <label className="block text-sm font-medium text-grey-dark dark:text-gray-200 mb-2">Employer</label>
        <select
          value={selectedId}
          onChange={(e) => {
            setSelectedId(e.target.value);
            setSnapshot(null);
            setPreviewActive(false);
          }}
          className="w-full max-w-md rounded border border-grey-background dark:border-[#374151] bg-white dark:bg-[#0D1117] px-3 py-2 text-grey-dark dark:text-gray-200"
        >
          <option value="">Select employer</option>
          {employers.map((e) => (
            <option key={e.id} value={e.id}>{e.company_name}</option>
          ))}
        </select>
      </div>
      <div className="flex gap-2 mb-4">
        <Button onClick={loadReputation} disabled={!selectedId || loading}>
          {loading ? "Loading…" : "View reputation"}
        </Button>
        <Button variant="secondary" onClick={generatePreview} disabled={!selectedId}>
          Generate 10-min preview
        </Button>
      </div>
      {message && <p className="text-sm text-amber-600 dark:text-amber-400 mb-4">{message}</p>}
      {previewExpires && (
        <p className="text-sm text-grey-medium dark:text-gray-400 mb-4">
          Preview expires: {new Date(previewExpires).toLocaleString()}
        </p>
      )}
      {snapshot && (
        <div className="border border-grey-background dark:border-[#374151] rounded p-4 space-y-2">
          <h3 className="font-semibold text-grey-dark dark:text-gray-200">Reputation breakdown</h3>
          <p className="text-2xl font-bold text-primary dark:text-blue-400">{Number(snapshot.reputation_score).toFixed(1)} overall</p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            <li>Verification integrity: {Number(snapshot.verification_integrity_score).toFixed(1)}</li>
            <li>Dispute ratio: {Number(snapshot.dispute_ratio_score).toFixed(1)}</li>
            <li>Rehire confirmation: {Number(snapshot.rehire_confirmation_score).toFixed(1)}</li>
            <li>Worker retention: {Number(snapshot.worker_retention_score).toFixed(1)}</li>
            <li>Response time: {Number(snapshot.response_time_score).toFixed(1)}</li>
            <li>Workforce risk: {Number(snapshot.workforce_risk_score).toFixed(1)}</li>
            <li>Fraud flag: {Number(snapshot.fraud_flag_score).toFixed(1)}</li>
            <li>Network trust: {Number(snapshot.network_trust_score).toFixed(1)}</li>
            <li>Compliance: {Number(snapshot.compliance_score).toFixed(1)}</li>
          </ul>
          {snapshot.last_calculated_at && (
            <p className="text-xs text-grey-medium dark:text-gray-500">Last calculated: {new Date(snapshot.last_calculated_at).toLocaleString()}</p>
          )}
        </div>
      )}
    </Card>
  );
}
