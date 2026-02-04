"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { DataDensityMetrics } from "@/types/simulation";

interface DataDensitySnapshot {
  id: string;
  snapshot_at: string;
  scope: string;
  scope_id: string | null;
  profiles_count: number;
  employment_records_count: number;
  references_count: number;
  intelligence_rows_count: number;
  is_simulation: boolean;
  created_at: string;
}

export function InvestorSandboxClient() {
  const [snapshots, setSnapshots] = useState<DataDensitySnapshot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [capturing, setCapturing] = useState(false);

  const fetchSnapshots = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/simulation-lab/data-density?scope=global&limit=20");
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setSnapshots(data.snapshots ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSnapshots();
  }, [fetchSnapshots]);

  const captureGlobal = async () => {
    setCapturing(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/simulation-lab/data-density", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope: "global" }),
      });
      if (!res.ok) throw new Error(await res.text());
      await fetchSnapshots();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to capture");
    } finally {
      setCapturing(false);
    }
  };

  const latest = snapshots[0];
  const previous = snapshots[1];
  const deltas: Partial<DataDensityMetrics> = latest && previous
    ? {
        profilesCount: latest.profiles_count - previous.profiles_count,
        employmentRecordsCount: latest.employment_records_count - previous.employment_records_count,
        referencesCount: latest.references_count - previous.references_count,
        intelligenceRowsCount: latest.intelligence_rows_count - previous.intelligence_rows_count,
      }
    : null;

  return (
    <div className="space-y-8">
      {error && (
        <div className="rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-2 text-sm text-red-300">
          {error}
        </div>
      )}

      <Card className="border-gray-700 bg-gray-800/50">
        <CardHeader>
          <CardTitle className="text-lg text-gray-100">Data Density Tracker</CardTitle>
          <p className="text-sm text-gray-400">Global production counts. Capture snapshot to record current state.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button size="sm" onClick={captureGlobal} disabled={capturing || loading}>
            {capturing ? "Capturing…" : "Capture global snapshot"}
          </Button>
          {loading && !snapshots.length ? (
            <p className="text-sm text-gray-500">Loading…</p>
          ) : latest ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="rounded-lg border border-gray-600 bg-gray-900/50 p-4">
                <p className="text-xs text-gray-500">Profiles</p>
                <p className="text-2xl font-bold text-gray-100">{latest.profiles_count.toLocaleString()}</p>
                {deltas && deltas.profilesCount !== undefined && (
                  <p className={`text-xs ${deltas.profilesCount >= 0 ? "text-green-400" : "text-red-400"}`}>
                    {deltas.profilesCount >= 0 ? "+" : ""}{deltas.profilesCount} vs previous
                  </p>
                )}
              </div>
              <div className="rounded-lg border border-gray-600 bg-gray-900/50 p-4">
                <p className="text-xs text-gray-500">Employment records</p>
                <p className="text-2xl font-bold text-gray-100">{latest.employment_records_count.toLocaleString()}</p>
                {deltas && deltas.employmentRecordsCount !== undefined && (
                  <p className={`text-xs ${deltas.employmentRecordsCount >= 0 ? "text-green-400" : "text-red-400"}`}>
                    {deltas.employmentRecordsCount >= 0 ? "+" : ""}{deltas.employmentRecordsCount} vs previous
                  </p>
                )}
              </div>
              <div className="rounded-lg border border-gray-600 bg-gray-900/50 p-4">
                <p className="text-xs text-gray-500">References</p>
                <p className="text-2xl font-bold text-gray-100">{latest.references_count.toLocaleString()}</p>
                {deltas && deltas.referencesCount !== undefined && (
                  <p className={`text-xs ${deltas.referencesCount >= 0 ? "text-green-400" : "text-red-400"}`}>
                    {deltas.referencesCount >= 0 ? "+" : ""}{deltas.referencesCount} vs previous
                  </p>
                )}
              </div>
              <div className="rounded-lg border border-gray-600 bg-gray-900/50 p-4">
                <p className="text-xs text-gray-500">Intelligence rows</p>
                <p className="text-2xl font-bold text-gray-100">{latest.intelligence_rows_count.toLocaleString()}</p>
                {deltas && deltas.intelligenceRowsCount !== undefined && (
                  <p className={`text-xs ${deltas.intelligenceRowsCount >= 0 ? "text-green-400" : "text-red-400"}`}>
                    {deltas.intelligenceRowsCount >= 0 ? "+" : ""}{deltas.intelligenceRowsCount} vs previous
                  </p>
                )}
              </div>
            </div>
          ) : null}
          {snapshots.length > 1 && (
            <div className="rounded border border-gray-600 p-3">
              <p className="text-xs text-gray-500 mb-2">Recent snapshots (UTC)</p>
              <ul className="text-sm text-gray-300 space-y-1">
                {snapshots.slice(0, 5).map((s) => (
                  <li key={s.id}>
                    {new Date(s.snapshot_at).toISOString().slice(0, 19)} — P: {s.profiles_count}, E: {s.employment_records_count}, R: {s.references_count}, I: {s.intelligence_rows_count}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-gray-700 bg-gray-800/50">
        <CardHeader>
          <CardTitle className="text-lg text-gray-100">Sandbox mode</CardTitle>
          <p className="text-sm text-gray-400">Investor sandbox is read-only. Use Simulation Lab for persona creation and load tests.</p>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">
            <a href="/admin/testing-lab" className="text-blue-400 hover:underline">Testing Lab</a> — Create sessions, personas, peer reviews, ad simulation.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
