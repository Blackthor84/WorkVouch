"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const API = "/api/admin/sandbox-v2";

type Session = { id: string; name: string | null; starts_at: string; ends_at: string; status: string; created_at?: string };
type Employer = { id: string; company_name?: string; industry?: string; plan_tier?: string };
type Employee = { id: string; full_name?: string; industry?: string };
type IntelOutput = { employee_id: string; profile_strength?: number; career_health?: number; risk_index?: number; team_fit?: number; hiring_confidence?: number; network_density?: number };
type Executive = { avgProfileStrength: number | null; avgHiringConfidence: number | null; totalSpend: number; adRoi: number | null; dataDensityIndex: number };
type SandboxMetricsRow = {
  profiles_count?: number;
  employment_records_count?: number;
  references_count?: number;
  avg_profile_strength?: number | null;
  avg_career_health?: number | null;
  avg_risk_index?: number | null;
  avg_team_fit?: number | null;
  avg_hiring_confidence?: number | null;
  avg_network_density?: number | null;
  mrr?: number | null;
  ad_roi?: number | null;
} | null;
type Metrics = {
  session: Session | null;
  sandbox_metrics: SandboxMetricsRow;
  employeeIntelligence: { employeesCount: number; employmentRecordsCount: number; peerReviewsCount: number; avgHiringConfidence: number | null; avgProfileStrength: number | null; outputs: IntelOutput[]; employees?: Employee[] };
  employerAnalytics: { employersCount: number; employers: Employer[] };
  revenueSimulation: { mrr: number; churn_rate: number; revenueRows: number };
  adsSimulation: { campaignsCount: number; totalSpend: number; totalImpressions: number; totalClicks: number };
  rawCounts: { profiles: number; employers: number; employmentRecords: number; references: number };
  executive?: Executive;
  employers: Employer[];
  employees: Employee[];
};
type FeatureItem = { id: string; feature_key: string; is_enabled: boolean };
type TemplateItem = { id: string; template_key: string; display_name: string; industry: string; default_employee_count: number; description?: string | null };

export function SandboxV2Client() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [currentSandboxId, setCurrentSandboxId] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<Metrics | null>(null);
  const [features, setFeatures] = useState<FeatureItem[]>([]);
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [employerName, setEmployerName] = useState("");
  const [employerIndustry, setEmployerIndustry] = useState("");
  const [employerPlanTier, setEmployerPlanTier] = useState("pro");
  const [employeeName, setEmployeeName] = useState("");
  const [employeeIndustry, setEmployeeIndustry] = useState("");
  const [peerReviewerId, setPeerReviewerId] = useState("");
  const [peerReviewedId, setPeerReviewedId] = useState("");
  const [peerRating, setPeerRating] = useState(3);
  const [peerReviewText, setPeerReviewText] = useState("");
  const [hireEmployeeId, setHireEmployeeId] = useState("");
  const [hireEmployerId, setHireEmployerId] = useState("");
  const [hireRole, setHireRole] = useState("");
  const [hireTenureMonths, setHireTenureMonths] = useState(12);
  const [hireRehireEligible, setHireRehireEligible] = useState(true);
  const [adsEmployerId, setAdsEmployerId] = useState("");
  const [adsImpressions, setAdsImpressions] = useState(1000);
  const [adsClicks, setAdsClicks] = useState(50);
  const [adsSpend, setAdsSpend] = useState(100);
  const [churnRate, setChurnRate] = useState(0.05);
  const [viewAs, setViewAs] = useState<"Admin" | "Employer" | "Employee">("Admin");
  const [executiveMode, setExecutiveMode] = useState(false);
  const [genEmployerLoading, setGenEmployerLoading] = useState(false);
  const [genEmployeeLoading, setGenEmployeeLoading] = useState(false);
  const [peerReviewLoading, setPeerReviewLoading] = useState(false);
  const [hireLoading, setHireLoading] = useState(false);
  const [adsLoading, setAdsLoading] = useState(false);
  const [revenueLoading, setRevenueLoading] = useState(false);
  const [recalcLoading, setRecalcLoading] = useState(false);
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [syncFeaturesLoading, setSyncFeaturesLoading] = useState(false);
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [selectedTemplateKey, setSelectedTemplateKey] = useState("");
  const [templateEmployeeOverride, setTemplateEmployeeOverride] = useState("");
  const [deployTemplateLoading, setDeployTemplateLoading] = useState(false);
  const [deployProgress, setDeployProgress] = useState<string[]>([]);
  const [demoMode, setDemoMode] = useState<string | null>(null);
  const [demoModeLoading, setDemoModeLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedReviews, setSubmittedReviews] = useState<{ id: string; reviewerName: string; reviewedName: string; rating: number; review_text: string | null }[]>([]);
  const [sentimentMultiplier, setSentimentMultiplier] = useState(1.0);
  const [peerReviewerNameOverride, setPeerReviewerNameOverride] = useState("");
  const [peerReviewedNameOverride, setPeerReviewedNameOverride] = useState("");
  const [demoDataLoading, setDemoDataLoading] = useState(false);

  const log = useCallback((msg: string, type: "info" | "success" | "error" = "info") => {
    const prefix = type === "success" ? "[OK] " : type === "error" ? "[ERR] " : "> ";
    setConsoleLogs((prev) => [...prev.slice(-99), `${prefix}${msg}`]);
  }, []);

  async function fetchSessions() {
    try {
      const res = await fetch(`${API}/sessions`, { credentials: "include" });
      const raw = await res.text();
      if (!res.ok) {
        console.error("API failed", res.status);
        setSessions([]);
        return;
      }
      let json: { success?: boolean; data?: unknown };
      try {
        json = JSON.parse(raw);
      } catch (e) {
        console.error("JSON PARSE FAILED", e);
        setSessions([]);
        return;
      }
      if (!json.success) {
        console.error("API returned failure", json);
        setSessions([]);
        return;
      }
      if (json.success) {
        const data = Array.isArray(json.data) ? json.data : [];
        const sorted = [...data].sort(
          (a: { created_at?: string }, b: { created_at?: string }) =>
            new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime()
        );
        setSessions(sorted);
        if (sorted.length > 0) {
          setCurrentSandboxId((prev) => prev || (sorted[0] as { id: string }).id);
        }
      }
    } catch (err) {
      console.error("fetchSessions failed", err);
      setError(err instanceof Error ? err.message : "Error");
      setSessions([]);
    }
  }

  async function fetchDashboard(sandboxIdArg: string) {
    if (!sandboxIdArg) return;
    try {
      const res = await fetch(`${API}/dashboard?sandboxId=${encodeURIComponent(sandboxIdArg)}`, { credentials: "include" });
      const raw = await res.text();
      if (!res.ok) {
        console.error("Dashboard API failed", res.status);
        setDashboardData(null);
        return;
      }
      let json: { success?: boolean; data?: unknown };
      try {
        json = JSON.parse(raw);
      } catch (e) {
        console.error("JSON PARSE FAILED", e);
        setDashboardData(null);
        return;
      }
      if (json.success) {
        setDashboardData((json.data ?? null) as Metrics | null);
      } else {
        setDashboardData(null);
      }
    } catch (err) {
      console.error("fetchDashboard failed", err);
      setError(err instanceof Error ? err.message : "Error");
      setDashboardData(null);
    }
  }

  const refreshSandbox = useCallback(async (sandboxId: string) => {
    await fetchSessions();
    await fetchDashboard(sandboxId);
  }, []);

  const fetchFeatures = useCallback(async (id: string | null) => {
    try {
      const url = id ? `${API}/features?sandboxId=${encodeURIComponent(id)}` : `${API}/features`;
      const res = await fetch(url, { credentials: "include" });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) return;
      setFeatures(j.features ?? []);
      setOverrides(j.overrides ?? {});
    } catch {
      setFeatures([]);
      setOverrides({});
    }
  }, []);

  const fetchTemplates = useCallback(async () => {
    try {
      const res = await fetch(`${API}/templates`, { credentials: "include" });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) return;
      setTemplates(j.templates ?? []);
    } catch {
      setTemplates([]);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, []);

  useEffect(() => {
    if (!currentSandboxId) {
      setDashboardData(null);
      return;
    }
    fetchDashboard(currentSandboxId);
  }, [currentSandboxId]);

  const createSession = async () => {
    setLoading(true);
    setCreateLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: createName || null }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((json as { error?: string }).error || "Create failed");
      if (json.success && json.data && typeof (json.data as { id?: string }).id === "string") {
        const newId = (json.data as { id: string }).id;
        setCurrentSandboxId(newId);
        await refreshSandbox(newId);
        log("Session created: " + newId.slice(0, 8), "success");
      }
      setCreateName("");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error";
      setError(msg);
      log(msg, "error");
    } finally {
      setCreateLoading(false);
      setLoading(false);
    }
  };

  const generateEmployer = async () => {
    const sandboxId = currentSandboxId?.trim() || null;
    if (!sandboxId) return;
    setLoading(true);
    setGenEmployerLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/sandbox-v2/employers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ sandboxId: currentSandboxId }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((j as { error?: string }).error || "Generate failed");
      const data = (j as { data?: { id?: string } }).data;
      log("Employer created: " + (data?.id ?? "").slice(0, 8), "success");
      setEmployerName("");
      await refreshSandbox(sandboxId);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error";
      setError(msg);
      log(msg, "error");
    } finally {
      setGenEmployerLoading(false);
      setLoading(false);
    }
  };

  const generateEmployee = async () => {
    const sandboxId = currentSandboxId?.trim() || null;
    if (!sandboxId) return;
    setLoading(true);
    setGenEmployeeLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/sandbox-v2/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ sandboxId: currentSandboxId }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((j as { error?: string }).error || "Generate failed");
      const data = (j as { data?: { id?: string } }).data;
      log("Employee created: " + (data?.id ?? "").slice(0, 8), "success");
      setEmployeeName("");
      await refreshSandbox(sandboxId);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error";
      setError(msg);
      log(msg, "error");
    } finally {
      setGenEmployeeLoading(false);
      setLoading(false);
    }
  };

  const addPeerReview = async () => {
    const sandboxId = currentSandboxId?.trim() || null;
    const reviewerId = peerReviewerId?.trim() || null;
    const reviewedId = peerReviewedId?.trim() || null;
    if (!sandboxId || !reviewerId || !reviewedId) return;
    setLoading(true);
    setPeerReviewLoading(true);
    setError(null);
    try {
      const payload = {
        sandbox_id: sandboxId,
        reviewer_id: reviewerId,
        reviewed_id: reviewedId,
        rating: peerRating,
        review_text: peerReviewText?.trim() || null,
      };
      const res = await fetch(`${API}/peer-reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || "Add peer review failed");
      log("Peer review added (sentiment auto-calculated)", "success");
      const reviewerName =
        employees.find((e) => e.id === reviewerId)?.full_name ??
        reviewerId?.slice(0, 8) ??
        "";
      const reviewerDisplay =
        peerReviewerNameOverride?.trim() || reviewerName;
      const reviewedName =
        employees.find((e) => e.id === reviewedId)?.full_name ??
        reviewedId?.slice(0, 8) ??
        "";
      const reviewedDisplay =
        peerReviewedNameOverride?.trim() || reviewedName;
      setSubmittedReviews((prev) => [
        ...prev,
        {
          id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `rev-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          reviewerName: reviewerDisplay,
          reviewedName: reviewedDisplay,
          rating: peerRating,
          review_text: peerReviewText?.trim() || null,
        },
      ]);
      setPeerReviewText("");
      if (currentSandboxId) await refreshSandbox(currentSandboxId);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error";
      setError(msg);
      log(msg, "error");
    } finally {
      setPeerReviewLoading(false);
      setLoading(false);
    }
  };

  const handleAddEmployment = async () => {
    const sandboxId = currentSandboxId?.trim() || null;
    const employeeId = hireEmployeeId?.trim() || null;
    const employerId = hireEmployerId?.trim() || null;
    if (!sandboxId || !employeeId || !employerId) return;
    setLoading(true);
    setHireLoading(true);
    setError(null);
    try {
      const payload = {
        sandbox_id: sandboxId,
        employee_id: employeeId,
        employer_id: employerId,
        role: hireRole?.trim() || null,
        tenure_months: hireTenureMonths,
        rehire_eligible: hireRehireEligible,
      };
      const res = await fetch(`${API}/employment-records`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || "Hiring simulation failed");
      log("Employment record added", "success");
      if (currentSandboxId) await refreshSandbox(currentSandboxId);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error";
      setError(msg);
      log(msg, "error");
    } finally {
      setHireLoading(false);
      setLoading(false);
    }
  };

  const addHiring = handleAddEmployment;

  const addAds = async () => {
    if (!currentSandboxId) return;
    setLoading(true);
    setAdsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/ads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ sandbox_id: currentSandboxId, employer_id: adsEmployerId || undefined, impressions: adsImpressions, clicks: adsClicks, spend: adsSpend }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || "Ads simulation failed");
      log("Ad campaign added (ROI auto-calculated)", "success");
      if (currentSandboxId) await refreshSandbox(currentSandboxId);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error";
      setError(msg);
      log(msg, "error");
    } finally {
      setAdsLoading(false);
      setLoading(false);
    }
  };

  const updateRevenue = async () => {
    if (!currentSandboxId) return;
    setLoading(true);
    setRevenueLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/revenue`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ sandbox_id: currentSandboxId, churn_rate: churnRate }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || "Revenue update failed");
      log(`Revenue: MRR=${j.mrr}, churn=${churnRate}`, "success");
      if (currentSandboxId) await refreshSandbox(currentSandboxId);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error";
      setError(msg);
      log(msg, "error");
    } finally {
      setRevenueLoading(false);
      setLoading(false);
    }
  };

  const runRecalculate = async () => {
    if (!currentSandboxId) return;
    setLoading(true);
    setRecalcLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/recalculate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ sandbox_id: currentSandboxId }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || "Recalculate failed");
      log("Intelligence recalculated", "success");
      if (currentSandboxId) await refreshSandbox(currentSandboxId);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error";
      setError(msg);
      log(msg, "error");
    } finally {
      setRecalcLoading(false);
      setLoading(false);
    }
  };

  const runCleanup = async () => {
    setLoading(true);
    setCleanupLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/cleanup`, { method: "POST", credentials: "include" });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || "Cleanup failed");
      log(`Cleanup: ${j.deleted ?? 0} expired sessions deleted`, "success");
      await fetchSessions();
      if (currentSandboxId && (j.deleted ?? 0) > 0) {
        setCurrentSandboxId(null);
        setDashboardData(null);
      } else if (currentSandboxId) {
        await refreshSandbox(currentSandboxId);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error";
      setError(msg);
      log(msg, "error");
    } finally {
      setCleanupLoading(false);
      setLoading(false);
    }
  };

  const syncFeatures = async () => {
    setSyncFeaturesLoading(true);
    try {
      const res = await fetch(`${API}/features/sync`, { method: "POST", credentials: "include" });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || "Sync failed");
      log(`Features synced: ${j.synced ?? 0}`, "success");
      await fetchFeatures(currentSandboxId);
    } catch (e) {
      log(e instanceof Error ? e.message : "Error", "error");
    } finally {
      setSyncFeaturesLoading(false);
    }
  };

  const setFeatureOverride = async (featureKey: string, isEnabled: boolean) => {
    if (!currentSandboxId) return;
    try {
      const res = await fetch(`${API}/feature-overrides`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ sandbox_id: currentSandboxId, feature_key: featureKey, is_enabled: isEnabled }),
      });
      if (!res.ok) return;
      setOverrides((prev) => ({ ...prev, [featureKey]: isEnabled }));
    } catch {
      // no-op
    }
  };

  const handlePreset = async () => {
    if (!currentSandboxId) return;
    try {
      const res = await fetch(`${API}/preset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ sandboxId: currentSandboxId }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error((j as { error?: string }).error || "Preset failed");
      }
      await fetchDashboard(currentSandboxId);
      log("Template loaded", "success");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error";
      setError(msg);
      log(msg, "error");
    }
  };

  const handleDeployTemplate = async () => {
    const sandboxId = currentSandboxId?.trim() || null;
    if (!sandboxId) {
      alert("No active sandbox selected");
      return;
    }
    try {
      const res = await fetch(`${API}/preset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ sandboxId }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((j as { error?: string }).error || "Preset failed");
      if (!(j as { success?: boolean }).success) throw new Error("Preset returned success: false");
      await refreshSandbox(sandboxId);
      log("Template deployed", "success");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error";
      setError(msg);
      log(msg, "error");
    }
  };

  const deployTemplate = async () => {
    if (!currentSandboxId || !selectedTemplateKey) return;
    setLoading(true);
    setDeployTemplateLoading(true);
    setDeployProgress(["Starting…"]);
    setError(null);
    try {
      const override = templateEmployeeOverride.trim() ? parseInt(templateEmployeeOverride, 10) : undefined;
      const res = await fetch(`${API}/generate-template`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ sandbox_id: currentSandboxId, template_key: selectedTemplateKey, employee_count_override: override }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || "Deploy failed");
      const stats = j.stats ?? {};
      setDeployProgress([
        `Employees created: ${stats.employees ?? 0}`,
        `Reviews created: ${stats.reviews ?? 0}`,
        "Intelligence calculated",
        "Revenue simulated",
        "Ads simulated",
      ].filter(Boolean));
      log(`Template deployed: ${stats.employees ?? 0} employees, ${stats.reviews ?? 0} reviews`, "success");
      if (currentSandboxId) await refreshSandbox(currentSandboxId);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error";
      setError(msg);
      log(msg, "error");
      setDeployProgress([]);
    } finally {
      setDeployTemplateLoading(false);
      setLoading(false);
    }
  };

  const setDemoModePreset = async (mode: string | null) => {
    if (!currentSandboxId) return;
    setDemoModeLoading(true);
    try {
      const res = await fetch(`${API}/demo-mode`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ sandbox_id: currentSandboxId, demo_mode: mode ?? null }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || "Set demo mode failed");
      setDemoMode(j.demo_mode ?? null);
      log(mode ? `Demo mode: ${mode}` : "Demo mode cleared", "success");
    } catch (e) {
      log(e instanceof Error ? e.message : "Error", "error");
    } finally {
      setDemoModeLoading(false);
    }
  };

  const employers = dashboardData?.employers ?? [];
  const employees = dashboardData?.employees ?? [];
  const ei = dashboardData?.employeeIntelligence ?? null;
  const ea = dashboardData?.employerAnalytics ?? null;
  const rev = dashboardData?.revenueSimulation ?? null;
  const ads = dashboardData?.adsSimulation ?? null;
  const exec = dashboardData?.executive;

  const activeSession = currentSandboxId ? sessions.find((s) => s.id === currentSandboxId) : null;
  const now = typeof window !== "undefined" ? Date.now() : 0;
  const sessionEnded = activeSession?.ends_at ? new Date(activeSession.ends_at).getTime() < now : false;
  const sessionStatus: "no_session" | "expired" | "active" = !currentSandboxId
    ? "no_session"
    : sessionEnded
      ? "expired"
      : "active";

  const clearSubmittedReviews = () => setSubmittedReviews([]);

  /** Reviewed dropdown: exclude selected reviewer to prevent self peer reviews */
  const reviewedCandidates = employees.filter((e) => e.id !== peerReviewerId);

  const generateDemoData = async () => {
    const sandboxId = currentSandboxId?.trim() || null;
    if (!sandboxId) return;
    setDemoDataLoading(true);
    setError(null);
    try {
      log("Generate Demo Data: creating 1 employer…", "info");
      const empRes = await fetch(`${API}/employers`, { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ sandboxId }) });
      const empJ = await empRes.json().catch(() => ({}));
      if (!empRes.ok) throw new Error((empJ as { error?: string }).error || "Create employer failed");
      const employerId = (empJ as { data?: { id?: string } }).data?.id;
      if (!employerId) throw new Error("Employer created but no id returned");
      await refreshSandbox(sandboxId);

      log("Generate Demo Data: creating 3 employees…", "info");
      const employeeIds: string[] = [];
      for (let i = 0; i < 3; i++) {
        const res = await fetch(`${API}/employees`, { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ sandboxId }) });
        const j = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error((j as { error?: string }).error || "Create employee failed");
        const id = (j as { data?: { id?: string } }).data?.id;
        if (id) employeeIds.push(id);
      }
      if (employeeIds.length < 2) throw new Error("Need at least 2 employees for peer reviews");
      await refreshSandbox(sandboxId);

      log("Generate Demo Data: adding 5 peer reviews…", "info");
      const pairs: [string, string][] = [];
      for (let a = 0; a < employeeIds.length; a++) {
        for (let b = 0; b < employeeIds.length; b++) {
          if (a !== b) pairs.push([employeeIds[a], employeeIds[b]]);
        }
      }
      for (let i = 0; i < Math.min(5, pairs.length); i++) {
        const [reviewer_id, reviewed_id] = pairs[i % pairs.length];
        const prRes = await fetch(`${API}/peer-reviews`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ sandbox_id: sandboxId, reviewer_id, reviewed_id, rating: 4, review_text: "Demo peer review." }),
        });
        if (!prRes.ok) throw new Error("Peer review failed");
      }
      await refreshSandbox(sandboxId);

      const eid1 = employeeIds[0];
      const eid2 = employeeIds[1];
      if (eid1 && employerId) {
        log("Generate Demo Data: adding employment record 1…", "info");
        const er1 = await fetch(`${API}/employment-records`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ sandbox_id: sandboxId, employee_id: eid1, employer_id: employerId, role: "Engineer", tenure_months: 12, rehire_eligible: true }),
        });
        if (!er1.ok) throw new Error("Employment record 1 failed");
      }
      if (eid2 && employerId) {
        log("Generate Demo Data: adding employment record 2…", "info");
        const er2 = await fetch(`${API}/employment-records`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ sandbox_id: sandboxId, employee_id: eid2, employer_id: employerId, role: "Analyst", tenure_months: 6, rehire_eligible: true }),
        });
        if (!er2.ok) throw new Error("Employment record 2 failed");
      }
      await refreshSandbox(sandboxId);

      log("Generate Demo Data: recalculating intelligence…", "info");
      const recRes = await fetch(`${API}/recalculate`, { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ sandboxId }) });
      if (!recRes.ok) throw new Error("Recalculate failed");
      await refreshSandbox(sandboxId);
      log("Generate Demo Data: done.", "success");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error";
      setError(msg);
      log(msg, "error");
    } finally {
      setDemoDataLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <header className="sticky top-0 z-10 border-b border-slate-700 bg-slate-900/98 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-3">
          <span className="text-xl font-semibold text-slate-100">Enterprise Simulation Environment</span>
          <div className="flex items-center gap-4">
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                sessionStatus === "active"
                  ? "bg-emerald-500/20 text-emerald-300"
                  : sessionStatus === "expired"
                    ? "bg-amber-500/20 text-amber-300"
                    : "bg-slate-600/50 text-slate-400"
              }`}
            >
              {sessionStatus === "active" ? "Session active" : sessionStatus === "expired" ? "Session expired" : "No session"}
            </span>
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input type="checkbox" checked={executiveMode} onChange={(e) => setExecutiveMode(e.target.checked)} className="rounded" />
              Executive Mode
            </label>
            <Link href="/admin">
              <Button variant="ghost" size="sm" className="text-slate-200 hover:text-white">← Admin</Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1600px] grid-cols-1 gap-6 p-6 lg:grid-cols-[1fr_400px]">
        {/* Left column: Session control, generators, peer review */}
        <div className="space-y-6">
        {error && (
          <div className="rounded-xl border border-red-500/60 bg-red-500/15 px-4 py-3 text-red-200">{error}</div>
        )}

        {/* No sandbox selected */}
        {!currentSandboxId && (
          <div className="rounded-2xl border border-amber-600/50 bg-amber-500/10 px-4 py-6 text-amber-100">
            <p className="font-medium">No sandbox selected</p>
            <p className="mt-1 text-sm text-amber-200/90">Select a sandbox above to view aggregated metrics and generate employees, employers, peer reviews, or simulations. All values are derived from sandbox data.</p>
          </div>
        )}

        {/* Loading when sandbox selected but dashboard not yet loaded */}
        {currentSandboxId && !dashboardData && (
          <div className="rounded-2xl border border-slate-700 bg-slate-800 px-4 py-8 text-center text-base text-slate-400">Loading...</div>
        )}

        {/* Executive Dashboard (boardroom ready) — only when sandbox selected */}
        {currentSandboxId && executiveMode && (
          <section className="rounded-2xl border-2 border-slate-600 bg-slate-800 p-8 shadow-xl">
            <h2 className="text-xl font-semibold text-slate-100">Executive Dashboard</h2>
            <div className="mt-4 border-t border-slate-600 pt-4">
              {loading ? (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="h-24 animate-pulse rounded-xl border border-slate-600 bg-slate-800" />
                  ))}
                </div>
              ) : exec ? (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                  <div className="rounded-xl border border-slate-600 bg-slate-800/90 p-4 text-slate-100">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Total Sandbox MRR</p>
                    <p className="mt-1 text-2xl font-bold text-cyan-300">{rev?.mrr != null ? rev.mrr : "—"}</p>
                  </div>
                  <div className="rounded-xl border border-slate-600 bg-slate-800/90 p-4 text-slate-100">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Growth %</p>
                    <p className="mt-1 text-2xl font-bold text-cyan-300">—</p>
                  </div>
                  <div className="rounded-xl border border-slate-600 bg-slate-800/90 p-4 text-slate-100">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Avg Profile Strength</p>
                    <p className="mt-1 text-2xl font-bold text-cyan-300">{exec.avgProfileStrength != null ? exec.avgProfileStrength.toFixed(1) : "—"}</p>
                  </div>
                  <div className="rounded-xl border border-slate-600 bg-slate-800/90 p-4 text-slate-100">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Avg Hiring Confidence</p>
                    <p className="mt-1 text-2xl font-bold text-cyan-300">{exec.avgHiringConfidence != null ? exec.avgHiringConfidence.toFixed(1) : "—"}</p>
                  </div>
                  <div className="rounded-xl border border-slate-600 bg-slate-800/90 p-4 text-slate-100">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Ad ROI</p>
                    <p className="mt-1 text-2xl font-bold text-cyan-300">{exec.adRoi != null ? exec.adRoi.toFixed(2) : "—"}</p>
                  </div>
                  <div className="rounded-xl border border-slate-600 bg-slate-800/90 p-4 text-slate-100">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Data Density Index</p>
                    <p className="mt-1 text-2xl font-bold text-cyan-300">{exec.dataDensityIndex != null ? exec.dataDensityIndex : "—"}</p>
                  </div>
                </div>
              ) : null}
            </div>
          </section>
        )}

        {/* Sandbox Session Control */}
        <section className="rounded-2xl border-2 border-slate-600 bg-slate-800 p-8 shadow-xl">
          <h2 className="text-xl font-semibold text-slate-100">Sandbox Session Control</h2>
          <div className="mt-4 border-t border-slate-600 pt-4">
          <div className="mt-4 flex flex-wrap items-end gap-4">
            <div>
              <Label className="text-slate-400">Name</Label>
              <Input value={createName} onChange={(e) => setCreateName(e.target.value)} placeholder="New session name" className="mt-1 w-48 border-slate-700 bg-slate-800 text-white" />
            </div>
            <Button onClick={createSession} disabled={loading || createLoading}>{createLoading ? "Creating…" : "Create session"}</Button>
            <div className="ml-4">
              <Label className="text-slate-300">Active session</Label>
              <select value={currentSandboxId ?? ""} onChange={(e) => setCurrentSandboxId(e.target.value || null)} className="mt-1 rounded border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100">
                <option value="">None</option>
                {sessions?.map((s) => (
                  <option key={s.id} value={s.id}>{s.name || s.id.slice(0, 8)} — {s.status}</option>
                ))}
              </select>
              <p className="mt-1 text-sm text-slate-400">Active Sandbox: {currentSandboxId ?? "—"}</p>
              {sessions.length === 0 && (
                <div style={{ padding: 20, opacity: 0.6 }}>No sessions found</div>
              )}
            </div>
          </div>
          </div>
        </section>

        {/* Auto Population Templates */}
        <div className="rounded-2xl border-2 border-slate-600 bg-gradient-to-br from-slate-900 to-slate-800 p-8 shadow-xl">
          <h2 className="text-xl font-semibold text-slate-100">Auto Population Templates</h2>
          <p className="mt-1 text-sm text-slate-400">One-click deploy: employees, reviews, intelligence, revenue, ads.</p>
          <div className="mt-4 flex flex-wrap items-end gap-4">
            <div>
              <Label className="text-slate-400">Select Template</Label>
              <select value={selectedTemplateKey} onChange={(e) => setSelectedTemplateKey(e.target.value)} className="mt-1 rounded border border-slate-700 bg-slate-800 px-3 py-2 text-white">
                <option value="">—</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.template_key}>{t.display_name} ({t.default_employee_count})</option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-slate-400">Override Employee Count (optional)</Label>
              <Input type="number" min={1} value={templateEmployeeOverride} onChange={(e) => setTemplateEmployeeOverride(e.target.value)} placeholder="Default" className="mt-1 w-28 border-slate-700 bg-slate-800 text-white" />
            </div>
            <Button onClick={handlePreset}>Load Template</Button>
            <div style={{ position: "relative", zIndex: 1000 }}>
              <button
                onClick={handleDeployTemplate}
                className="px-4 py-2 bg-blue-600 text-white rounded"
              >
                Deploy Template
              </button>
            </div>
          </div>
          {deployProgress.length > 0 && (
            <div className="mt-4 space-y-1">
              <p className="text-sm font-medium text-slate-300">Progress</p>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                <div className="h-full bg-cyan-500 transition-all" style={{ width: deployProgress.length >= 5 ? "100%" : `${(deployProgress.length / 5) * 100}%` }} />
              </div>
              <ul className="mt-2 space-y-1 text-sm text-slate-400">
                {deployProgress.map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>
            </div>
          )}
          {currentSandboxId && dashboardData !== null && dashboardData.sandbox_metrics && (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl border border-cyan-600/40 bg-slate-900/60 p-3">
                <p className="text-xs uppercase tracking-wide text-slate-400">Avg Profile Strength</p>
                <p className="text-2xl font-bold text-cyan-400">{dashboardData.sandbox_metrics.avg_profile_strength != null ? Number(dashboardData.sandbox_metrics.avg_profile_strength).toFixed(1) : "—"}</p>
              </div>
              <div className="rounded-xl border border-cyan-600/40 bg-slate-900/60 p-3">
                <p className="text-xs uppercase tracking-wide text-slate-400">Hiring Confidence</p>
                <p className="text-2xl font-bold text-cyan-400">{dashboardData.sandbox_metrics.avg_hiring_confidence != null ? Number(dashboardData.sandbox_metrics.avg_hiring_confidence).toFixed(1) : "—"}</p>
              </div>
              <div className="rounded-xl border border-cyan-600/40 bg-slate-900/60 p-3">
                <p className="text-xs uppercase tracking-wide text-slate-400">MRR</p>
                <p className="text-2xl font-bold text-cyan-400">{dashboardData.sandbox_metrics.mrr != null ? Number(dashboardData.sandbox_metrics.mrr) : "—"}</p>
              </div>
              <div className="rounded-xl border border-cyan-600/40 bg-slate-900/60 p-3">
                <p className="text-xs uppercase tracking-wide text-slate-400">Ad ROI</p>
                <p className="text-2xl font-bold text-cyan-400">{dashboardData.sandbox_metrics.ad_roi != null ? Number(dashboardData.sandbox_metrics.ad_roi).toFixed(2) : "—"}</p>
              </div>
            </div>
          )}
        </div>

        {/* Preset Demo Modes */}
        <div className="rounded-2xl border border-slate-700 bg-slate-800 p-6 shadow-xl">
          <h2 className="text-lg font-semibold text-slate-100">Preset Demo Modes</h2>
          <p className="mt-1 text-sm text-slate-400">Alter display emphasis (review volume, sentiment, revenue, risk, churn, ad ROI) without regenerating data.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {[
              { key: "boardroom", label: "Boardroom Mode" },
              { key: "high_risk", label: "High Risk Scenario" },
              { key: "rapid_growth", label: "Rapid Growth Scenario" },
              { key: "investor_pitch", label: "Investor Pitch Mode" },
              { key: "ad_explosion", label: "Ad Explosion Mode" },
            ].map(({ key, label }) => (
              <Button key={key} variant={demoMode === key ? "primary" : "secondary"} size="sm" onClick={() => setDemoModePreset(demoMode === key ? null : key)} disabled={!currentSandboxId || demoModeLoading}>
                {label}
              </Button>
            ))}
            {demoMode && <span className="self-center text-sm text-slate-400">Active: {demoMode}</span>}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Employer Generator */}
          <div className="rounded-2xl border-2 border-slate-600 bg-slate-800 p-8 shadow-xl">
            <h2 className="text-xl font-semibold text-slate-100">Employer Generator</h2>
            <div className="mt-4 space-y-3">
              <div>
                <Label className="text-slate-400">Company name</Label>
                <Input value={employerName} onChange={(e) => setEmployerName(e.target.value)} placeholder="Company name" className="mt-1 border-slate-700 bg-slate-800 text-white" />
              </div>
              <div>
                <Label className="text-slate-400">Industry</Label>
                <Input value={employerIndustry} onChange={(e) => setEmployerIndustry(e.target.value)} placeholder="Industry" className="mt-1 border-slate-700 bg-slate-800 text-white" />
              </div>
              <div>
                <Label className="text-slate-400">Plan tier</Label>
                <select value={employerPlanTier} onChange={(e) => setEmployerPlanTier(e.target.value)} className="mt-1 rounded border border-slate-700 bg-slate-800 px-3 py-2 text-white">
                  <option value="starter">Starter</option>
                  <option value="pro">Pro</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>
              <Button onClick={generateEmployer} disabled={loading || !currentSandboxId || genEmployerLoading}>{genEmployerLoading ? "…" : "Generate employer"}</Button>
            </div>
          </div>

          {/* Employee Generator */}
          <div className="rounded-2xl border-2 border-slate-600 bg-slate-800 p-8 shadow-xl">
            <h2 className="text-xl font-semibold text-slate-100">Employee Generator</h2>
            <div className="mt-4 space-y-3">
              <div>
                <Label className="text-slate-400">Full name</Label>
                <Input value={employeeName} onChange={(e) => setEmployeeName(e.target.value)} placeholder="Full name" className="mt-1 border-slate-700 bg-slate-800 text-white" />
              </div>
              <div>
                <Label className="text-slate-400">Industry</Label>
                <Input value={employeeIndustry} onChange={(e) => setEmployeeIndustry(e.target.value)} placeholder="Industry" className="mt-1 border-slate-700 bg-slate-800 text-white" />
              </div>
              <Button onClick={generateEmployee} disabled={loading || !currentSandboxId || genEmployeeLoading}>{genEmployeeLoading ? "…" : "Generate employee"}</Button>
            </div>
          </div>
        </div>

        {/* Employees list (above Peer Review Builder) */}
        <div className="rounded-2xl border-2 border-slate-600 bg-slate-800 p-8 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-100">Employees</h2>
              <p className="mt-1 text-sm text-slate-400">{employees.length} total</p>
            </div>
            <Button onClick={generateDemoData} disabled={!currentSandboxId || demoDataLoading || loading} variant="secondary">
              {demoDataLoading ? "Generating…" : "Generate Demo Data"}
            </Button>
          </div>
          <p className="mt-2 text-xs text-slate-500">Demo: 3 employees, 1 employer, 5 peer reviews, 2 employment records, then recalculate.</p>
          <div className="mt-4 max-h-48 space-y-2 overflow-y-auto">
            {employees.length === 0 && (
              <p className="text-sm text-slate-500">No employees yet. Generate employees or use Generate Demo Data.</p>
            )}
            {employees.map((e) => (
              <div key={e.id} className="flex items-center justify-between rounded-lg border border-slate-600 bg-slate-700/80 px-3 py-2">
                <div>
                  <span className="font-medium text-slate-100">{e.full_name ?? e.id.slice(0, 8)}</span>
                  <span className="ml-2 text-sm text-slate-400">{e.industry ?? "—"}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-slate-400 hover:text-red-300"
                  disabled
                  title="Delete employee (requires backend support)"
                >
                  Delete
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Peer Review Builder */}
        <div className="rounded-2xl border-2 border-slate-600 bg-slate-800 p-8 shadow-xl">
          <h2 className="text-xl font-semibold text-slate-100">Peer Review Builder</h2>
          <p className="mt-1 text-sm text-slate-400">Sentiment score auto-calculated. Submit multiple reviews.</p>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label className="text-slate-400">Reviewer</Label>
              <select
                value={peerReviewerId}
                onChange={(e) => {
                  const next = e.target.value;
                  setPeerReviewerId(next);
                  if (next && peerReviewedId === next) setPeerReviewedId("");
                }}
                className="mt-1 rounded border border-slate-600 bg-slate-700 px-3 py-2 text-base text-slate-100"
              >
                <option value="">Select employee</option>
                {employees?.length === 0 && <option disabled>No employees yet</option>}
                {employees?.map((e) => (
                  <option key={e.id} value={e.id}>{e.full_name ?? e.id.slice(0, 8)}</option>
                ))}
              </select>
              <Input value={peerReviewerNameOverride} onChange={(e) => setPeerReviewerNameOverride(e.target.value)} placeholder="Override display name (optional)" className="mt-1.5 border-slate-600 bg-slate-700/80 text-sm text-slate-100" />
            </div>
            <div>
              <Label className="text-slate-400">Reviewed</Label>
              <select
                value={peerReviewedId}
                onChange={(e) => setPeerReviewedId(e.target.value)}
                className="mt-1 rounded border border-slate-600 bg-slate-700 px-3 py-2 text-base text-slate-100"
              >
                <option value="">Select employee</option>
                {reviewedCandidates.length === 0 && <option disabled>No other employees (or select reviewer first)</option>}
                {reviewedCandidates.map((e) => (
                  <option key={e.id} value={e.id}>{e.full_name ?? e.id.slice(0, 8)}</option>
                ))}
              </select>
              <Input value={peerReviewedNameOverride} onChange={(e) => setPeerReviewedNameOverride(e.target.value)} placeholder="Override display name (optional)" className="mt-1.5 border-slate-600 bg-slate-700/80 text-sm text-slate-100" />
            </div>
            <div className="sm:col-span-2">
              <Label className="text-slate-400">Rating (1–5): {peerRating}</Label>
              <input type="range" min={1} max={5} step={1} value={peerRating} onChange={(e) => setPeerRating(parseInt(e.target.value, 10))} className="mt-2 w-full accent-cyan-500" />
            </div>
            <div className="sm:col-span-2">
              <Label className="text-slate-400">Review text</Label>
              <Input value={peerReviewText} onChange={(e) => setPeerReviewText(e.target.value)} placeholder="Review text (sentiment auto-calculated)" className="mt-1 border-slate-600 bg-slate-700 text-base text-slate-100" />
            </div>
            <div className="flex flex-wrap gap-2 sm:col-span-2">
              <Button onClick={addPeerReview} disabled={loading || !currentSandboxId || !peerReviewerId || !peerReviewedId || peerReviewLoading}>{peerReviewLoading ? "…" : "Add peer review"}</Button>
              <Button variant="secondary" onClick={clearSubmittedReviews} disabled={submittedReviews.length === 0}>Clear Reviews</Button>
            </div>
          </div>
          {submittedReviews.length > 0 && (
            <div className="mt-4 rounded-lg border border-slate-600 bg-slate-700/50 p-3">
              <p className="mb-2 text-sm font-medium text-slate-300">Submitted reviews ({submittedReviews.length})</p>
              <ul className="max-h-40 space-y-2 overflow-y-auto text-sm text-slate-200">
                {submittedReviews.map((r) => (
                  <li key={r.id} className="rounded border border-slate-600 bg-slate-700/80 p-2">
                    <span className="font-medium">{r.reviewerName}</span> → <span className="font-medium">{r.reviewedName}</span> · {r.rating}/5
                    {r.review_text && <p className="mt-1 truncate text-slate-400">{r.review_text}</p>}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Score simulation: sentiment multiplier */}
        <div className="rounded-2xl border-2 border-slate-600 bg-slate-800 p-8 shadow-xl">
          <h2 className="text-xl font-semibold text-slate-100">Score simulation</h2>
          <p className="mt-1 text-sm text-slate-400">Sentiment multiplier (0.5–2.0). Click Recalculate to apply.</p>
          <div className="mt-4">
            <Label className="text-slate-400">Multiplier: {sentimentMultiplier.toFixed(1)}</Label>
            <input type="range" min={0.5} max={2} step={0.1} value={sentimentMultiplier} onChange={(e) => setSentimentMultiplier(parseFloat(e.target.value))} className="mt-2 w-full accent-cyan-500" />
          </div>
          <Button variant="secondary" className="mt-4" onClick={runRecalculate} disabled={loading || !currentSandboxId || recalcLoading}>{recalcLoading ? "…" : "Recalculate intelligence"}</Button>
        </div>

        {/* Hiring Simulation */}
        <div className="rounded-2xl border border-slate-700 bg-slate-800 p-6 shadow-xl">
          <h2 className="text-lg font-semibold text-slate-100">Hiring Simulation</h2>
          <div className="mt-4 flex flex-wrap gap-4">
            <div>
              <Label className="text-slate-400">Employee</Label>
              <select value={hireEmployeeId} onChange={(e) => setHireEmployeeId(e.target.value)} className="mt-1 rounded border border-slate-700 bg-slate-800 px-3 py-2 text-white">
                <option value="">Select employee</option>
                {employees?.length === 0 && <option disabled>No employees yet</option>}
                {employees?.map((e) => (
                  <option key={e.id} value={e.id}>{e.full_name ?? e.id.slice(0, 8)}</option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-slate-400">Employer</Label>
              <select value={hireEmployerId} onChange={(e) => setHireEmployerId(e.target.value)} className="mt-1 rounded border border-slate-700 bg-slate-800 px-3 py-2 text-white">
                <option value="">Select employer</option>
                {employers?.map((e) => (
                  <option key={e.id} value={e.id}>{e.company_name ?? e.id.slice(0, 8)}</option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-slate-400">Role</Label>
              <Input value={hireRole} onChange={(e) => setHireRole(e.target.value)} placeholder="Role" className="mt-1 border-slate-700 bg-slate-800 text-white" />
            </div>
            <div>
              <Label className="text-slate-400">Tenure (months)</Label>
              <Input type="number" value={hireTenureMonths} onChange={(e) => setHireTenureMonths(parseInt(e.target.value, 10) || 0)} className="mt-1 w-24 border-slate-700 bg-slate-800 text-white" />
            </div>
            <label className="flex items-center gap-2 text-slate-400">
              <input type="checkbox" checked={hireRehireEligible} onChange={(e) => setHireRehireEligible(e.target.checked)} className="rounded" />
              Rehire eligible
            </label>
            <button
                onClick={handleAddEmployment}
                className="px-4 py-2 bg-green-600 text-white rounded"
              >
                Add Employment
              </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Ads Simulation */}
          <div className="rounded-2xl border-2 border-slate-600 bg-slate-800 p-8 shadow-xl">
            <h2 className="text-xl font-semibold text-slate-100">Ads Simulation</h2>
            <p className="mt-1 text-sm text-slate-400">ROI = (clicks × 150 − spend) / spend</p>
            <div className="mt-4 flex flex-wrap gap-4">
              <div>
                <Label className="text-slate-400">Employer</Label>
                <select value={adsEmployerId} onChange={(e) => setAdsEmployerId(e.target.value)} className="mt-1 rounded border border-slate-700 bg-slate-800 px-3 py-2 text-white">
                  <option value="">Optional</option>
                  {employers.map((e) => (
                    <option key={e.id} value={e.id}>{e.company_name ?? e.id.slice(0, 8)}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="text-slate-400">Impressions</Label>
                <Input type="number" value={adsImpressions} onChange={(e) => setAdsImpressions(parseInt(e.target.value, 10) || 0)} className="mt-1 w-28 border-slate-700 bg-slate-800 text-white" />
              </div>
              <div>
                <Label className="text-slate-400">Clicks</Label>
                <Input type="number" value={adsClicks} onChange={(e) => setAdsClicks(parseInt(e.target.value, 10) || 0)} className="mt-1 w-28 border-slate-700 bg-slate-800 text-white" />
              </div>
              <div>
                <Label className="text-slate-400">Spend</Label>
                <Input type="number" value={adsSpend} onChange={(e) => setAdsSpend(parseFloat(e.target.value) || 0)} className="mt-1 w-28 border-slate-700 bg-slate-800 text-white" />
              </div>
              <Button onClick={addAds} disabled={loading || !currentSandboxId || adsLoading}>{adsLoading ? "…" : "Add ad campaign"}</Button>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-slate-700 bg-slate-800 p-4">
                <p className="text-sm uppercase tracking-wide text-slate-400">Total spend</p>
                <p className="text-3xl font-bold text-cyan-400">{currentSandboxId && dashboardData ? (ads?.totalSpend ?? "—") : "—"}</p>
              </div>
              <div className="rounded-xl border border-slate-700 bg-slate-800 p-4">
                <p className="text-sm uppercase tracking-wide text-slate-400">Campaigns</p>
                <p className="text-3xl font-bold text-cyan-400">{currentSandboxId && dashboardData ? (ads?.campaignsCount ?? 0) : "—"}</p>
              </div>
            </div>
          </div>

          {/* Revenue Simulation */}
          <div className="rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
            <h2 className="text-lg font-semibold text-white">Revenue Simulation</h2>
            <p className="mt-1 text-sm text-slate-400">MRR = employer count × plan value. Churn adjustable.</p>
            <div className="mt-4 space-y-3">
              <div>
                <Label className="text-slate-400">Churn rate (0–1)</Label>
                <input type="range" min="0" max="1" step="0.01" value={churnRate} onChange={(e) => setChurnRate(parseFloat(e.target.value))} className="w-full" />
                <span className="ml-2 text-cyan-400">{(churnRate * 100).toFixed(0)}%</span>
              </div>
              <Button onClick={updateRevenue} disabled={loading || !currentSandboxId || revenueLoading}>{revenueLoading ? "…" : "Update revenue"}</Button>
            </div>
            <div className="mt-4 rounded-xl border border-slate-700 bg-slate-800 p-4">
              <p className="text-sm uppercase tracking-wide text-slate-400">Sandbox MRR</p>
              <p className="text-3xl font-bold text-cyan-400">{currentSandboxId && dashboardData && rev?.mrr != null ? rev.mrr : "—"}</p>
            </div>
          </div>
        </div>

        {/* Employee Intelligence + Employer Analytics — only when dashboard loaded */}
        {dashboardData !== null ? (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border-2 border-slate-600 bg-slate-800 p-8 shadow-xl">
              <h2 className="text-xl font-semibold text-slate-100">Employee Intelligence</h2>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="rounded-xl border border-slate-700 bg-slate-800 p-4">
                  <p className="text-sm uppercase tracking-wide text-slate-400">Employees</p>
                  <p className="text-3xl font-bold text-cyan-400">{currentSandboxId ? employees.length : "—"}</p>
                </div>
                <div className="rounded-xl border border-slate-700 bg-slate-800 p-4">
                  <p className="text-sm uppercase tracking-wide text-slate-400">Employment records</p>
                  <p className="text-3xl font-bold text-cyan-400">{currentSandboxId ? (ei?.employmentRecordsCount ?? 0) : "—"}</p>
                </div>
                <div className="rounded-xl border border-slate-700 bg-slate-800 p-4">
                  <p className="text-sm uppercase tracking-wide text-slate-400">Peer reviews</p>
                  <p className="text-3xl font-bold text-cyan-400">{currentSandboxId ? (ei?.peerReviewsCount ?? 0) : "—"}</p>
                </div>
                <div className="rounded-xl border border-slate-700 bg-slate-800 p-4">
                  <p className="text-sm uppercase tracking-wide text-slate-400">Avg hiring confidence</p>
                  <p className="text-3xl font-bold text-cyan-400">{ei?.avgHiringConfidence != null ? ei.avgHiringConfidence.toFixed(1) : "—"}</p>
                </div>
              </div>
              {employees.length === 0 && (
                <p className="mt-4 text-sm text-slate-500">No employees yet</p>
              )}
              {employees.map((e) => (
                <div key={e.id} className="mt-2 rounded-md border border-slate-700 p-3">
                  <div className="font-medium text-white">{e.full_name ?? e.id.slice(0, 8)}</div>
                  <div className="text-sm text-slate-500">{e.industry ?? "—"}</div>
                </div>
              ))}
              <Button variant="secondary" className="mt-4" onClick={runRecalculate} disabled={loading || !currentSandboxId || recalcLoading}>{recalcLoading ? "…" : "Recalculate intelligence"}</Button>
            </div>
            <div className="rounded-2xl border-2 border-slate-600 bg-slate-800 p-8 shadow-xl">
              <h2 className="text-xl font-semibold text-slate-100">Employer Analytics</h2>
              <div className="mt-4 rounded-xl border border-slate-700 bg-slate-800 p-4">
                <p className="text-sm uppercase tracking-wide text-slate-400">Employers</p>
                <p className="text-3xl font-bold text-cyan-400">{currentSandboxId ? employers.length : "—"}</p>
              </div>
              {employers.length === 0 && (
                <p className="mt-4 text-sm text-slate-400">No employers generated yet.</p>
              )}
              {employers.map((e) => (
                <div key={e.id} className="mb-3 rounded-lg border border-slate-700 bg-slate-700 p-3">
                  <div className="font-medium text-white">{e.company_name ?? e.id.slice(0, 8)}</div>
                  <div className="text-sm text-slate-400">
                    {e.industry ?? "—"} • {e.plan_tier ?? "—"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : currentSandboxId ? (
          <div style={{ padding: 20, opacity: 0.6 }}>No metrics loaded. Select a sandbox and refresh.</div>
        ) : null}

        {/* Feature Toggles */}
        <div className="rounded-2xl border-2 border-slate-600 bg-slate-800 p-8 shadow-xl">
          <h2 className="text-xl font-semibold text-slate-100">Feature Toggles</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={syncFeatures} disabled={syncFeaturesLoading}>{syncFeaturesLoading ? "…" : "Sync from production"}</Button>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {features.map((f) => (
              <label key={f.id} className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2">
                <input type="checkbox" checked={overrides[f.feature_key] ?? f.is_enabled} onChange={(e) => currentSandboxId && setFeatureOverride(f.feature_key, e.target.checked)} className="rounded" />
                <span className="text-sm text-slate-300">{f.feature_key}</span>
              </label>
            ))}
            {features.length === 0 && <p className="text-sm text-slate-500">Sync from production to see flags.</p>}
          </div>
        </div>

        {/* View-As Mode */}
        <div className="rounded-2xl border-2 border-slate-600 bg-slate-800 p-8 shadow-xl">
          <h2 className="text-xl font-semibold text-slate-100">View-As Mode</h2>
          <p className="mt-1 text-sm text-slate-400">Simulate plan gating, feature access, intelligence visibility (sandbox-only).</p>
          <div className="mt-4 flex gap-2">
            {(["Admin", "Employer", "Employee"] as const).map((mode) => (
              <Button key={mode} variant={viewAs === mode ? "primary" : "secondary"} onClick={() => setViewAs(mode)}>View as {mode}</Button>
            ))}
          </div>
          <p className="mt-2 text-sm text-slate-500">Current: {viewAs}</p>
        </div>

        {/* Actions */}
        <div className="rounded-2xl border-2 border-slate-600 bg-slate-800 p-8 shadow-xl">
          <h2 className="text-xl font-semibold text-slate-100">Actions</h2>
          <Button variant="secondary" className="mt-4" onClick={runCleanup} disabled={loading || cleanupLoading}>{cleanupLoading ? "…" : "Cleanup expired sessions"}</Button>
        </div>

        {/* Console */}
        <section className="rounded-2xl border-2 border-slate-600 bg-slate-800 p-8 shadow-xl">
          <h2 className="text-xl font-semibold text-slate-100">Command Console</h2>
          <div className="mt-4 border-t border-slate-600 pt-4">
            <div className="max-h-72 overflow-y-auto rounded-lg border border-slate-600 bg-slate-800/90 p-4 font-mono text-base text-slate-200">
              {consoleLogs.length === 0 && <p className="text-slate-500">No output yet.</p>}
              {consoleLogs.map((line, i) => (
                <p key={i} className={line.startsWith("[ERR]") ? "text-red-300" : line.startsWith("[OK]") ? "text-emerald-300" : "text-slate-300"}>{line}</p>
              ))}
            </div>
          </div>
        </section>
        </div>

        {/* Right column: Generated lists + live metrics */}
        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          {/* Generated Employers */}
          <div className="rounded-xl border-2 border-slate-600 bg-slate-800 p-6">
            <h2 className="mb-2 text-xl font-semibold text-slate-100">Generated Employers</h2>
            <p className="mb-3 text-sm text-slate-400">{employers.length} total</p>
            <div className="max-h-56 overflow-y-auto space-y-2">
              {employers.length === 0 && (
                <p className="text-sm text-slate-500">No employers generated yet.</p>
              )}
              {employers.map((e) => (
                <div key={e.id} className="rounded-lg border border-slate-600 bg-slate-700 p-2.5">
                  <div className="font-medium text-slate-100">{e.company_name ?? e.id.slice(0, 8)}</div>
                  <div className="text-sm text-slate-400">{e.industry ?? "—"} · {e.plan_tier ?? "—"}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Generated Employees */}
          <div className="rounded-xl border border-slate-700 bg-slate-800 p-5">
            <h2 className="mb-2 text-base font-semibold text-slate-100">Generated Employees</h2>
            <p className="mb-3 text-sm text-slate-400">{employees.length} total</p>
            <div className="max-h-56 overflow-y-auto space-y-2">
              {employees.length === 0 && (
                <p className="text-sm text-slate-500">No employees generated yet.</p>
              )}
              {employees.map((e) => (
                <div key={e.id} className="rounded-lg border border-slate-600 bg-slate-700 p-2.5">
                  <div className="font-medium text-slate-100">{e.full_name ?? e.id.slice(0, 8)}</div>
                  <div className="text-sm text-slate-400">{e.industry ?? "—"}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Live metrics */}
          {dashboardData && (
            <div className="rounded-xl border-2 border-slate-600 bg-slate-800 p-6">
              <h2 className="mb-3 text-xl font-semibold text-slate-100">Live metrics</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Employers</span>
                  <span className="font-medium text-slate-100">{employers.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Employees</span>
                  <span className="font-medium text-slate-100">{employees.length}</span>
                </div>
                {ei != null && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Employment records</span>
                      <span className="font-medium text-slate-100">{ei.employmentRecordsCount ?? "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Peer reviews</span>
                      <span className="font-medium text-slate-100">{ei.peerReviewsCount ?? "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Avg hiring confidence</span>
                      <span className="font-medium text-slate-100">{ei.avgHiringConfidence != null ? ei.avgHiringConfidence.toFixed(1) : "—"}</span>
                    </div>
                  </>
                )}
                {rev != null && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">MRR</span>
                    <span className="font-medium text-slate-100">{rev.mrr ?? "—"}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
