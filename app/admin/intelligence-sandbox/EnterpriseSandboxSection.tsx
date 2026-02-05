"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

type SandboxRow = { id: string; name: string | null; starts_at: string; ends_at: string; status: string; created_at: string };
type SandboxMetrics = {
  profiles_count: number;
  employers_count: number;
  peer_reviews_count: number;
  hiring_confidence_avg: number | null;
  hiring_confidence_sample: number[];
  ad_campaigns_count: number;
  ad_total_spend: number;
  ad_total_impressions: number;
  ad_total_clicks: number;
  ad_total_conversions: number;
  employers?: { id: string; company_name: string | null }[];
};

const VIEW_AS_OPTIONS = ["Admin", "Employee", "Employer"] as const;

export function EnterpriseSandboxSection({ employerList }: { employerList: { id: string; company_name?: string }[] }) {
  const [sandboxes, setSandboxes] = useState<SandboxRow[]>([]);
  const [sandboxId, setSandboxId] = useState("");
  const [metrics, setMetrics] = useState<SandboxMetrics | null>(null);
  const [viewAs, setViewAs] = useState<"Admin" | "Employee" | "Employer">("Admin");
  const [name, setName] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [loading, setLoading] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [genEmployeeLoading, setGenEmployeeLoading] = useState(false);
  const [genEmployerLoading, setGenEmployerLoading] = useState(false);
  const [peerReviewLoading, setPeerReviewLoading] = useState(false);
  const [simHiringLoading, setSimHiringLoading] = useState(false);
  const [simAdsLoading, setSimAdsLoading] = useState(false);
  const [reviewerUserId, setReviewerUserId] = useState("");
  const [reviewedUserId, setReviewedUserId] = useState("");
  const [candidateId, setCandidateId] = useState("");
  const [employerIdForHiring, setEmployerIdForHiring] = useState("");
  const [employerIdForAds, setEmployerIdForAds] = useState("");

  const fetchSandboxes = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/intelligence-sandbox?list=1", { credentials: "include" });
      if (!res.ok) return;
      const j = await res.json();
      setSandboxes(j.sandboxes ?? []);
    } catch {
      setSandboxes([]);
    }
  }, []);

  const fetchMetrics = useCallback(async (id: string) => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/intelligence-sandbox?sandboxId=${encodeURIComponent(id)}`, { credentials: "include" });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error || "Failed to load metrics");
        setMetrics(null);
        return;
      }
      const j = await res.json();
      setMetrics(j.metrics ?? null);
    } catch {
      setError("Request failed");
      setMetrics(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSandboxes();
  }, [fetchSandboxes]);

  useEffect(() => {
    if (sandboxId) fetchMetrics(sandboxId);
    else setMetrics(null);
  }, [sandboxId, fetchMetrics]);

  useEffect(() => {
    const runCleanup = async () => {
      try {
        await fetch("/api/admin/intelligence-sandbox/cleanup", { method: "POST", credentials: "include" });
        await fetchSandboxes();
      } catch {
        // non-fatal
      }
    };
    runCleanup();
  }, [fetchSandboxes]);

  const createSandbox = async () => {
    setCreateLoading(true);
    setError(null);
    try {
      const now = new Date();
      const start = startsAt ? new Date(startsAt) : now;
      const end = endsAt ? new Date(endsAt) : new Date(now.getTime() + 60 * 60 * 1000);
      const res = await fetch("/api/admin/intelligence-sandbox/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: name || null, startsAt: start.toISOString(), endsAt: end.toISOString() }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error || "Create failed");
        return;
      }
      const j = await res.json();
      setSandboxId(j.sandbox_id);
      await fetchSandboxes();
    } catch {
      setError("Request failed");
    } finally {
      setCreateLoading(false);
    }
  };

  const runCleanup = async () => {
    setCleanupLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/intelligence-sandbox/cleanup", { method: "POST", credentials: "include" });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error || "Cleanup failed");
        return;
      }
      await fetchSandboxes();
      if (sandboxId) await fetchMetrics(sandboxId);
    } catch {
      setError("Cleanup failed");
    } finally {
      setCleanupLoading(false);
    }
  };

  const generateEmployee = async () => {
    if (!sandboxId) return;
    setGenEmployeeLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/intelligence-sandbox/generate-employee", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ sandbox_id: sandboxId }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error || "Generate failed");
        return;
      }
      await fetchMetrics(sandboxId);
    } catch {
      setError("Request failed");
    } finally {
      setGenEmployeeLoading(false);
    }
  };

  const generateEmployer = async () => {
    if (!sandboxId) return;
    setGenEmployerLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/intelligence-sandbox/generate-employer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ sandbox_id: sandboxId }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error || "Generate failed");
        return;
      }
      await fetchMetrics(sandboxId);
    } catch {
      setError("Request failed");
    } finally {
      setGenEmployerLoading(false);
    }
  };

  const addPeerReview = async () => {
    if (!sandboxId || !reviewerUserId || !reviewedUserId) {
      setError("Sandbox, reviewer user ID, and reviewed user ID required");
      return;
    }
    setPeerReviewLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/intelligence-sandbox/add-peer-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ sandbox_id: sandboxId, reviewerUserId, reviewedUserId }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error || "Add peer review failed");
        return;
      }
      await fetchMetrics(sandboxId);
    } catch {
      setError("Request failed");
    } finally {
      setPeerReviewLoading(false);
    }
  };

  const simulateHiring = async () => {
    if (!sandboxId || !candidateId || !employerIdForHiring) {
      setError("Sandbox, candidate ID, and employer ID required");
      return;
    }
    setSimHiringLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/intelligence-sandbox/simulate-hiring", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ sandbox_id: sandboxId, candidate_id: candidateId, employer_id: employerIdForHiring }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error || "Simulate hiring failed");
        return;
      }
      await fetchMetrics(sandboxId);
    } catch {
      setError("Request failed");
    } finally {
      setSimHiringLoading(false);
    }
  };

  const simulateAds = async () => {
    if (!sandboxId) return;
    setSimAdsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/intelligence-sandbox/simulate-ads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ sandbox_id: sandboxId, employer_id: employerIdForAds || undefined }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error || "Simulate ads failed");
        return;
      }
      await fetchMetrics(sandboxId);
    } catch {
      setError("Request failed");
    } finally {
      setSimAdsLoading(false);
    }
  };

  const hasSandbox = Boolean(sandboxId);
  const employerOptions = (metrics?.employers && metrics.employers.length > 0) ? metrics.employers : employerList.map((e) => ({ id: e.id, company_name: e.company_name ?? null }));

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-emerald-500/50 bg-emerald-500/10 px-4 py-3">
        <span className="font-medium text-emerald-700 dark:text-emerald-400">
          Enterprise Simulation Lab — Fully isolated. Self-deleting. Production-safe.
        </span>
      </div>

      {error && <p className="text-red-500 dark:text-red-400 text-sm">{error}</p>}

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Sandbox Control</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Name (optional)</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="My sandbox" className="mt-1" />
            </div>
            <div>
              <Label>Start time</Label>
              <Input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>End time</Label>
              <Input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} className="mt-1" />
            </div>
            <Button onClick={createSandbox} disabled={createLoading}>
              {createLoading ? "Creating…" : "Create sandbox"}
            </Button>
            <div>
              <Label>Active sandbox</Label>
              <select
                value={sandboxId}
                onChange={(e) => setSandboxId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-grey-background dark:border-[#374151] bg-white dark:bg-[#111827] px-3 py-2 text-grey-dark dark:text-gray-200"
              >
                <option value="">Select…</option>
                {sandboxes.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name || s.id.slice(0, 8)} — {s.status}
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Generate data</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button onClick={generateEmployee} disabled={!hasSandbox || genEmployeeLoading} className="w-full">
              {genEmployeeLoading ? "Generating…" : "Generate employee"}
            </Button>
            <Button onClick={generateEmployer} disabled={!hasSandbox || genEmployerLoading} variant="secondary" className="w-full">
              {genEmployerLoading ? "Generating…" : "Generate employer"}
            </Button>
            <div className="pt-2 space-y-2">
              <Label>Add peer review (reviewer → reviewed)</Label>
              <Input value={reviewerUserId} onChange={(e) => setReviewerUserId(e.target.value)} placeholder="Reviewer user ID" />
              <Input value={reviewedUserId} onChange={(e) => setReviewedUserId(e.target.value)} placeholder="Reviewed user ID" />
              <Button onClick={addPeerReview} disabled={!hasSandbox || !reviewerUserId || !reviewedUserId || peerReviewLoading} variant="outline" className="w-full">
                {peerReviewLoading ? "Adding…" : "Add peer review"}
              </Button>
            </div>
            <div className="pt-2 space-y-2">
              <Label>Simulate hiring (candidate + employer)</Label>
              <Input value={candidateId} onChange={(e) => setCandidateId(e.target.value)} placeholder="Candidate user ID" />
              <select
                value={employerIdForHiring}
                onChange={(e) => setEmployerIdForHiring(e.target.value)}
                className="w-full rounded-lg border border-grey-background dark:border-[#374151] bg-white dark:bg-[#111827] px-3 py-2"
              >
                <option value="">Employer</option>
                {employerOptions.map((e) => (
                  <option key={e.id} value={e.id}>{e.company_name ?? e.id.slice(0, 8)}</option>
                ))}
              </select>
              <Button onClick={simulateHiring} disabled={!hasSandbox || !candidateId || !employerIdForHiring || simHiringLoading} variant="outline" className="w-full">
                {simHiringLoading ? "Running…" : "Simulate hiring"}
              </Button>
            </div>
            <div className="pt-2 space-y-2">
              <Label>Simulate ads</Label>
              <select
                value={employerIdForAds}
                onChange={(e) => setEmployerIdForAds(e.target.value)}
                className="w-full rounded-lg border border-grey-background dark:border-[#374151] bg-white dark:bg-[#111827] px-3 py-2"
              >
                <option value="">Employer (optional)</option>
                {employerOptions.map((e) => (
                  <option key={e.id} value={e.id}>{e.company_name ?? e.id.slice(0, 8)}</option>
                ))}
              </select>
              <Button onClick={simulateAds} disabled={!hasSandbox || simAdsLoading} variant="outline" className="w-full">
                {simAdsLoading ? "Running…" : "Simulate ads"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>View-as mode</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-grey-medium dark:text-gray-400">
              When viewing dashboards, filter by this sandbox as:
            </p>
            <div className="flex gap-2 flex-wrap">
              {VIEW_AS_OPTIONS.map((opt) => (
                <Button
                  key={opt}
                  variant={viewAs === opt ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewAs(opt)}
                >
                  View as {opt}
                </Button>
              ))}
            </div>
            {hasSandbox && (
              <p className="text-xs text-grey-medium dark:text-gray-400">
                Sandbox ID in context: {sandboxId.slice(0, 8)}…
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Live metrics</CardTitle>
          <Button variant="outline" size="sm" onClick={() => sandboxId && fetchMetrics(sandboxId)} disabled={loading || !sandboxId}>
            {loading ? "Loading…" : "Refresh"}
          </Button>
        </CardHeader>
        <CardContent>
          {!sandboxId && <p className="text-grey-medium dark:text-gray-400">Select a sandbox to see metrics.</p>}
          {sandboxId && metrics && (
            <dl className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
              <div><dt className="text-grey-medium dark:text-gray-400">Profiles</dt><dd className="font-medium">{metrics.profiles_count}</dd></div>
              <div><dt className="text-grey-medium dark:text-gray-400">Employers</dt><dd className="font-medium">{metrics.employers_count}</dd></div>
              <div><dt className="text-grey-medium dark:text-gray-400">Peer reviews</dt><dd className="font-medium">{metrics.peer_reviews_count}</dd></div>
              <div><dt className="text-grey-medium dark:text-gray-400">Hiring confidence (avg)</dt><dd className="font-medium">{metrics.hiring_confidence_avg != null ? metrics.hiring_confidence_avg.toFixed(2) : "—"}</dd></div>
              <div><dt className="text-grey-medium dark:text-gray-400">Ad campaigns</dt><dd className="font-medium">{metrics.ad_campaigns_count}</dd></div>
              <div><dt className="text-grey-medium dark:text-gray-400">Ad spend</dt><dd className="font-medium">${metrics.ad_total_spend.toFixed(2)}</dd></div>
              <div><dt className="text-grey-medium dark:text-gray-400">Impressions</dt><dd className="font-medium">{metrics.ad_total_impressions}</dd></div>
              <div><dt className="text-grey-medium dark:text-gray-400">Clicks</dt><dd className="font-medium">{metrics.ad_total_clicks}</dd></div>
              <div><dt className="text-grey-medium dark:text-gray-400">Conversions</dt><dd className="font-medium">{metrics.ad_total_conversions}</dd></div>
            </dl>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Force cleanup</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-grey-medium dark:text-gray-400 mb-3">
            Delete all expired sandbox data and update status to deleted.
          </p>
          <Button variant="destructive" onClick={runCleanup} disabled={cleanupLoading}>
            {cleanupLoading ? "Running…" : "Run cleanup"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
