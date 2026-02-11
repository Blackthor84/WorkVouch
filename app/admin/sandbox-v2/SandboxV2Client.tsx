"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ControlPanel } from "./ControlPanel";
import { SimulationCoreCard } from "./SimulationCoreCard";
import type { V1BreakdownComponents } from "./SimulationCoreCard";
import { LiveResultsPanel } from "./LiveResultsPanel";
import { EmployerDashboardClient } from "@/components/employer/EmployerDashboardClient";
import { getVerticalConfig } from "@/lib/verticals/config";

const API = "/api/admin/sandbox-v2";

const FEATURE_TEACHERS_MODE = typeof process !== "undefined" && process.env.NEXT_PUBLIC_FEATURE_TEACHERS_MODE === "true";

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
  const [employeeVerticalMetadata, setEmployeeVerticalMetadata] = useState<Record<string, unknown>>({});
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
  const [previousAvgHiringConfidence, setPreviousAvgHiringConfidence] = useState<number | null>(null);
  const [lastScoreDelta, setLastScoreDelta] = useState<number | null>(null);
  const [showDeltaUntil, setShowDeltaUntil] = useState(0);
  const [breakdown, setBreakdown] = useState<V1BreakdownComponents | null>(null);
  const [enabledVerticalNames, setEnabledVerticalNames] = useState<string[]>([]);
  const [signupFlowEmployeeIndustry, setSignupFlowEmployeeIndustry] = useState("");
  const [signupFlowExperienceLevel, setSignupFlowExperienceLevel] = useState("Mid");
  const [signupFlowReviewVolume, setSignupFlowReviewVolume] = useState("Medium");
  const [signupFlowRiskProfile, setSignupFlowRiskProfile] = useState("Clean");
  const [signupFlowEmployeeLoading, setSignupFlowEmployeeLoading] = useState(false);
  const [signupFlowEmployerIndustry, setSignupFlowEmployerIndustry] = useState("");
  const [signupFlowTier, setSignupFlowTier] = useState("pro");
  const [signupFlowCompanySize, setSignupFlowCompanySize] = useState("Medium");
  const [signupFlowEmployerLoading, setSignupFlowEmployerLoading] = useState(false);
  const teachersMode = FEATURE_TEACHERS_MODE;

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

  useEffect(() => {
    if (showDeltaUntil <= 0 || lastScoreDelta == null) return;
    const t = setTimeout(() => setShowDeltaUntil(0), Math.max(0, showDeltaUntil - Date.now()));
    return () => clearTimeout(t);
  }, [showDeltaUntil, lastScoreDelta]);

  useEffect(() => {
    if (!currentSandboxId || !dashboardData?.employees?.length) {
      setBreakdown(null);
      return;
    }
    const firstId = dashboardData.employees[0]?.id;
    if (!firstId) return;
    fetch(`/api/admin/intelligence/breakdown?sandboxId=${encodeURIComponent(currentSandboxId)}&employeeId=${encodeURIComponent(firstId)}`, { credentials: "include" })
      .then((r) => r.json())
      .then((j) => {
        if (j.components) setBreakdown(j.components as V1BreakdownComponents);
        else setBreakdown(null);
      })
      .catch(() => setBreakdown(null));
  }, [currentSandboxId, dashboardData?.employees]);

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
      const body: Record<string, unknown> = { sandboxId: currentSandboxId };
      if (employeeName?.trim()) body.full_name = employeeName.trim();
      if (employeeIndustry?.trim()) body.industry = employeeIndustry.trim();
      if (Object.keys(employeeVerticalMetadata).length > 0) body.vertical_metadata = employeeVerticalMetadata;
      const res = await fetch("/api/admin/sandbox-v2/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((j as { error?: string }).error || "Generate failed");
      const data = (j as { data?: { id?: string } }).data;
      log("Employee created: " + (data?.id ?? "").slice(0, 8), "success");
      setEmployeeName("");
      setEmployeeVerticalMetadata({});
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

  const router = useRouter();

  const runSignupFlowEmployee = () => {
    const sandboxId = currentSandboxId?.trim() || null;
    if (!sandboxId) return;
    log("Opening employee signup flow (same UI as production)", "info");
    const params = new URLSearchParams({ sandbox: "true", sandboxId });
    if (signupFlowEmployeeIndustry) params.set("industry", signupFlowEmployeeIndustry);
    router.push(`/signup/employee?${params.toString()}`);
  };

  const runSignupFlowEmployer = () => {
    const sandboxId = currentSandboxId?.trim() || null;
    if (!sandboxId) return;
    log("Opening employer signup flow (same UI as production)", "info");
    const params = new URLSearchParams({ sandbox: "true", sandboxId });
    if (signupFlowEmployerIndustry) params.set("industry", signupFlowEmployerIndustry);
    if (signupFlowTier) params.set("plan_tier", signupFlowTier);
    router.push(`/signup/employer?${params.toString()}`);
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
    const prevAvg = previousAvgHiringConfidence;
    setLoading(true);
    setRecalcLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/recalculate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          sandbox_id: currentSandboxId,
          sentimentMultiplier: sentimentMultiplier,
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || "Recalculate failed");
      log("Intelligence recalculated", "success");
      await refreshSandbox(currentSandboxId);
      const dashRes = await fetch(`${API}/dashboard?sandboxId=${encodeURIComponent(currentSandboxId)}`, { credentials: "include" });
      const dashJson = await dashRes.json().catch(() => ({}));
      if (dashJson.success && dashJson.data) {
        const data = dashJson.data as Metrics;
        const newAvg = data?.employeeIntelligence?.avgHiringConfidence ?? data?.sandbox_metrics?.avg_hiring_confidence;
        if (newAvg != null) {
          const numNew = Number(newAvg);
          setPreviousAvgHiringConfidence(numNew);
          if (prevAvg != null) {
            const delta = numNew - prevAvg;
            setLastScoreDelta(delta);
            setShowDeltaUntil(Date.now() + 4000);
          }
        }
      }
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

  const intelByEmployeeId = useMemo(() => {
    const map = new Map<string, { employee_id: string; profile_strength?: number | null }>();
    const outputs = ei?.outputs ?? [];
    for (const o of outputs) {
      if (o?.employee_id) map.set(o.employee_id, o);
    }
    return map;
  }, [ei?.outputs]);

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

  const avgScore = dashboardData?.employeeIntelligence?.avgProfileStrength ?? dashboardData?.sandbox_metrics?.avg_profile_strength ?? null;
  const isAdmin = viewAs === "Admin";
  const industryModifiers: string[] = isAdmin ? ["Construction (+3 Risk Adjustment)", "Education (+2 Stability Boost)"] : [];
  const showDeltaBadge = showDeltaUntil > 0 && lastScoreDelta != null;

  const inputClass = "rounded border border-slate-600 bg-slate-800 text-white placeholder-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500";

  return (
    <div className="sandbox-contrast min-h-screen bg-[#0b1220]">
      <style jsx global>{`
        .sandbox-contrast * {
          color: #ffffff !important;
        }

        .sandbox-contrast input,
        .sandbox-contrast select,
        .sandbox-contrast textarea {
          background-color: #1e293b !important;
          color: #ffffff !important;
          border: 1px solid #475569 !important;
        }

        .sandbox-contrast input::placeholder,
        .sandbox-contrast textarea::placeholder {
          color: #cbd5e1 !important;
        }
      `}</style>
      <header className="sticky top-0 z-10 border-b border-slate-700 bg-[#0b1220] backdrop-blur-sm">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-6 py-4">
          <span className="text-xl font-bold text-white">Simulation Command Center</span>
          <div className="flex items-center gap-4">
            <span
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                sessionStatus === "active"
                  ? "bg-emerald-600/30 text-emerald-300"
                  : sessionStatus === "expired"
                    ? "bg-amber-500/30 text-amber-300"
                    : "bg-slate-700 text-white"
              }`}
            >
              {sessionStatus === "active" ? "Session active" : sessionStatus === "expired" ? "Session expired" : "No session"}
            </span>
            <label className="flex items-center gap-2 text-sm text-white">
              <input type="checkbox" checked={executiveMode} onChange={(e) => setExecutiveMode(e.target.checked)} className="rounded" />
              Executive Mode
            </label>
            <Link href="/admin">
              <Button variant="ghost" size="sm" className="text-white hover:text-white hover:bg-[#0b1220]">← Admin</Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1600px] grid-cols-1 gap-6 p-6 lg:grid-cols-[1fr_1.2fr_1fr]">
        {/* LEFT: Control Panel (30%) */}
        <div className="min-w-0 space-y-4">
          <ControlPanel
            currentSandboxId={currentSandboxId}
            loading={loading}
            createName={createName}
            setCreateName={setCreateName}
            createLoading={createLoading}
            sessions={sessions}
            onCreateSession={createSession}
            onSessionChange={setCurrentSandboxId}
            employers={employers}
            employees={employees}
            intelByEmployeeId={intelByEmployeeId}
            employerName={employerName}
            setEmployerName={setEmployerName}
            employerIndustry={employerIndustry}
            setEmployerIndustry={setEmployerIndustry}
            employerPlanTier={employerPlanTier}
            setEmployerPlanTier={setEmployerPlanTier}
            employeeName={employeeName}
            setEmployeeName={setEmployeeName}
            employeeIndustry={employeeIndustry}
            setEmployeeIndustry={setEmployeeIndustry}
            employeeVerticalMetadata={employeeVerticalMetadata}
            setEmployeeVerticalMetadata={setEmployeeVerticalMetadata}
            enabledVerticalNames={enabledVerticalNames}
            genEmployerLoading={genEmployerLoading}
            genEmployeeLoading={genEmployeeLoading}
            onGenerateEmployer={generateEmployer}
            onGenerateEmployee={generateEmployee}
            teachersMode={teachersMode}
            peerReviewerId={peerReviewerId}
            setPeerReviewerId={setPeerReviewerId}
            peerReviewedId={peerReviewedId}
            setPeerReviewedId={setPeerReviewedId}
            peerRating={peerRating}
            setPeerRating={setPeerRating}
            peerReviewText={peerReviewText}
            setPeerReviewText={setPeerReviewText}
            peerReviewLoading={peerReviewLoading}
            reviewedCandidates={reviewedCandidates}
            submittedReviews={submittedReviews}
            onAddPeerReview={addPeerReview}
            onClearSubmittedReviews={clearSubmittedReviews}
            hireEmployeeId={hireEmployeeId}
            setHireEmployeeId={setHireEmployeeId}
            hireEmployerId={hireEmployerId}
            setHireEmployerId={setHireEmployerId}
            hireRole={hireRole}
            setHireRole={setHireRole}
            hireTenureMonths={hireTenureMonths}
            setHireTenureMonths={setHireTenureMonths}
            hireRehireEligible={hireRehireEligible}
            setHireRehireEligible={setHireRehireEligible}
            hireLoading={hireLoading}
            onAddEmployment={handleAddEmployment}
            adsEmployerId={adsEmployerId}
            setAdsEmployerId={setAdsEmployerId}
            adsImpressions={adsImpressions}
            setAdsImpressions={setAdsImpressions}
            adsClicks={adsClicks}
            setAdsClicks={setAdsClicks}
            adsSpend={adsSpend}
            setAdsSpend={setAdsSpend}
            adsLoading={adsLoading}
            onAddAds={addAds}
            churnRate={churnRate}
            setChurnRate={setChurnRate}
            revenueLoading={revenueLoading}
            onUpdateRevenue={updateRevenue}
            signupFlowEmployeeIndustry={signupFlowEmployeeIndustry}
            setSignupFlowEmployeeIndustry={setSignupFlowEmployeeIndustry}
            signupFlowExperienceLevel={signupFlowExperienceLevel}
            setSignupFlowExperienceLevel={setSignupFlowExperienceLevel}
            signupFlowReviewVolume={signupFlowReviewVolume}
            setSignupFlowReviewVolume={setSignupFlowReviewVolume}
            signupFlowRiskProfile={signupFlowRiskProfile}
            setSignupFlowRiskProfile={setSignupFlowRiskProfile}
            onSignupFlowEmployee={runSignupFlowEmployee}
            signupFlowEmployeeLoading={signupFlowEmployeeLoading}
            signupFlowEmployerIndustry={signupFlowEmployerIndustry}
            setSignupFlowEmployerIndustry={setSignupFlowEmployerIndustry}
            signupFlowTier={signupFlowTier}
            setSignupFlowTier={setSignupFlowTier}
            signupFlowCompanySize={signupFlowCompanySize}
            setSignupFlowCompanySize={setSignupFlowCompanySize}
            onSignupFlowEmployer={runSignupFlowEmployer}
            signupFlowEmployerLoading={signupFlowEmployerLoading}
          />
        </div>

        {/* CENTER: Simulation Core (40%) */}
        <div className="min-w-0 space-y-6">
          {error && (
            <div className="rounded-xl border border-red-600 bg-red-600/20 px-4 py-3 text-red-200 font-medium">{error}</div>
          )}

          {!currentSandboxId && (
            <div className="rounded-xl border border-amber-600 bg-amber-500/10 px-6 py-6 text-amber-100">
              <p className="font-semibold">No sandbox selected</p>
              <p className="mt-2 text-sm text-white">Select or create a session in the left panel to run simulations.</p>
            </div>
          )}

          {currentSandboxId && !dashboardData && (
            <div className="rounded-xl border border-slate-700 bg-[#0b1220] px-6 py-12 text-center text-white">Loading...</div>
          )}

          {viewAs === "Employer" && currentSandboxId && dashboardData && (
            <div className="rounded-xl border border-slate-700 bg-[#0b1220] p-6 overflow-auto max-h-[80vh]">
              <EmployerDashboardClient
                userRole="admin"
                planTier={employers[0]?.plan_tier ?? "pro"}
                employerId={employers[0]?.id}
                employerIndustry={employers[0]?.industry ?? null}
                sandboxMode={true}
                sandboxId={currentSandboxId}
              />
            </div>
          )}

          {viewAs !== "Employer" && currentSandboxId && dashboardData && (
            <SimulationCoreCard
              avgScore={avgScore}
              breakdown={breakdown}
              isAdmin={isAdmin}
              recalcLoading={recalcLoading}
              currentSandboxId={currentSandboxId}
              loading={loading}
              onRecalculate={runRecalculate}
              sentimentMultiplier={sentimentMultiplier}
              setSentimentMultiplier={setSentimentMultiplier}
              industryModifiers={industryModifiers}
              lastScoreDelta={lastScoreDelta}
              showDeltaBadge={showDeltaBadge}
            />
          )}

          {viewAs !== "Employer" && currentSandboxId && dashboardData && (() => {
            const employerIndustry = employers[0]?.industry;
            const vertical = getVerticalConfig(employerIndustry);
            return vertical ? (
              <div className="mt-6 rounded-xl border border-blue-500/40 bg-slate-800 p-4">
                <h2 className="text-lg font-semibold text-white">
                  {vertical.label}
                </h2>
                <p className="mt-2 text-sm text-slate-200">
                  {vertical.description}
                </p>
                <div className="mt-4">
                  <p className="font-medium text-blue-400">Highlighted Metrics</p>
                  <ul className="mt-1 list-disc pl-6 text-sm text-white">
                    {vertical.highlightMetrics.map((m) => (
                      <li key={m}>{m}</li>
                    ))}
                  </ul>
                </div>
                <div className="mt-4">
                  <p className="font-medium text-red-400">Risk Signals</p>
                  <ul className="mt-1 list-disc pl-6 text-sm text-white">
                    {vertical.riskSignals.map((r) => (
                      <li key={r}>{r}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : null;
          })()}

          {viewAs !== "Employer" && currentSandboxId && executiveMode && (
            <section className="rounded-xl border border-slate-700 bg-[#0b1220] p-6 shadow-xl">
              <h2 className="text-xl font-bold tracking-wide">Executive Dashboard</h2>
              <div className="mt-4 border-t border-slate-700 pt-4">
                {loading ? (
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div key={i} className="h-24 animate-pulse rounded-xl border border-slate-700 bg-[#0b1220]" />
                    ))}
                  </div>
                ) : exec ? (
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                    <div className="rounded-xl border border-slate-700 bg-[#0b1220] p-4 text-white">
                      <p className="text-xs font-medium uppercase tracking-wide text-white">Total Sandbox MRR</p>
                      <p className="mt-1 text-2xl font-bold text-blue-400">{rev?.mrr != null ? rev.mrr : "—"}</p>
                    </div>
                    <div className="rounded-xl border border-slate-700 bg-[#0b1220] p-4 text-white">
                      <p className="text-xs font-medium uppercase tracking-wide text-white">Growth %</p>
                      <p className="mt-1 text-2xl font-bold text-blue-400">—</p>
                    </div>
                    <div className="rounded-xl border border-slate-700 bg-[#0b1220] p-4 text-white">
                      <p className="text-xs font-medium uppercase tracking-wide text-white">Avg Profile Strength</p>
                      <p className="mt-1 text-2xl font-bold text-blue-400">{exec.avgProfileStrength != null ? exec.avgProfileStrength.toFixed(1) : "—"}</p>
                    </div>
                    <div className="rounded-xl border border-slate-700 bg-[#0b1220] p-4 text-white">
                      <p className="text-xs font-medium uppercase tracking-wide text-white">Avg Hiring Confidence</p>
                      <p className="mt-1 text-2xl font-bold text-blue-400">{exec.avgHiringConfidence != null ? exec.avgHiringConfidence.toFixed(1) : "—"}</p>
                    </div>
                    <div className="rounded-xl border border-slate-700 bg-[#0b1220] p-4 text-white">
                      <p className="text-xs font-medium uppercase tracking-wide text-white">Ad ROI</p>
                      <p className="mt-1 text-2xl font-bold text-blue-400">{exec.adRoi != null ? exec.adRoi.toFixed(2) : "—"}</p>
                    </div>
                    <div className="rounded-xl border border-slate-700 bg-[#0b1220] p-4 text-white">
                      <p className="text-xs font-medium uppercase tracking-wide text-white">Data Density Index</p>
                      <p className="mt-1 text-2xl font-bold text-blue-400">{exec.dataDensityIndex != null ? exec.dataDensityIndex : "—"}</p>
                    </div>
                  </div>
                ) : null}
              </div>
            </section>
          )}

          {viewAs !== "Employer" && (
          <div className="space-y-4">
        <details className="group rounded-xl border border-slate-700 bg-[#0b1220] overflow-hidden">
          <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 font-semibold text-white bg-[#0b1220] hover:bg-slate-700">
            <span>Auto Population Templates</span>
            <span className="text-white transition group-open:rotate-180">▼</span>
          </summary>
          <div className="border-t border-slate-700 px-4 py-4 bg-[#0b1220]">
            <h3 className="text-xl font-bold tracking-wide">Templates</h3>
            <p className="mt-1 text-sm text-white">One-click deploy: employees, reviews, intelligence, revenue, ads.</p>
            <div className="mt-4 flex flex-wrap items-end gap-4">
              <div>
                <Label className="font-medium text-white">Select Template</Label>
                <select value={selectedTemplateKey} onChange={(e) => setSelectedTemplateKey(e.target.value)} className={`mt-1 px-3 py-2 ${inputClass}`}>
                <option value="">—</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.template_key}>{t.display_name} ({t.default_employee_count})</option>
                ))}
              </select>
            </div>
            <div>
              <Label className="font-medium text-white">Override Employee Count (optional)</Label>
              <Input type="number" min={1} value={templateEmployeeOverride} onChange={(e) => setTemplateEmployeeOverride(e.target.value)} placeholder="Default" className={`mt-1 w-28 ${inputClass}`} />
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
              <p className="text-sm font-medium text-white">Progress</p>
              <div className="h-2 w-full overflow-hidden rounded-full bg-[#0b1220]">
                <div className="h-full bg-cyan-500 transition-all" style={{ width: deployProgress.length >= 5 ? "100%" : `${(deployProgress.length / 5) * 100}%` }} />
              </div>
              <ul className="mt-2 space-y-1 text-sm text-white">
                {deployProgress.map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>
            </div>
          )}
          {currentSandboxId && dashboardData !== null && dashboardData.sandbox_metrics && (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl border border-cyan-600/40 bg-[#0b1220]/60 p-3">
                <p className="text-xs uppercase tracking-wide text-white">Avg Profile Strength</p>
                <p className="text-2xl font-bold text-cyan-400">{dashboardData.sandbox_metrics.avg_profile_strength != null ? Number(dashboardData.sandbox_metrics.avg_profile_strength).toFixed(1) : "—"}</p>
              </div>
              <div className="rounded-xl border border-cyan-600/40 bg-[#0b1220]/60 p-3">
                <p className="text-xs uppercase tracking-wide text-white">Hiring Confidence</p>
                <p className="text-2xl font-bold text-cyan-400">{dashboardData.sandbox_metrics.avg_hiring_confidence != null ? Number(dashboardData.sandbox_metrics.avg_hiring_confidence).toFixed(1) : "—"}</p>
              </div>
              <div className="rounded-xl border border-cyan-600/40 bg-[#0b1220]/60 p-3">
                <p className="text-xs uppercase tracking-wide text-white">MRR</p>
                <p className="text-2xl font-bold text-cyan-400">{dashboardData.sandbox_metrics.mrr != null ? Number(dashboardData.sandbox_metrics.mrr) : "—"}</p>
              </div>
              <div className="rounded-xl border border-cyan-600/40 bg-[#0b1220]/60 p-3">
                <p className="text-xs uppercase tracking-wide text-white">Ad ROI</p>
                <p className="text-2xl font-bold text-cyan-400">{dashboardData.sandbox_metrics.ad_roi != null ? Number(dashboardData.sandbox_metrics.ad_roi).toFixed(2) : "—"}</p>
              </div>
            </div>
          )}
          </div>
        </details>

        <details className="group rounded-xl border border-slate-700 bg-[#0b1220] overflow-hidden">
          <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 font-semibold text-white bg-[#0b1220] hover:bg-slate-700">
            <span>Preset Demo Modes</span>
            <span className="text-white transition group-open:rotate-180">▼</span>
          </summary>
          <div className="border-t border-slate-700 px-4 py-4 bg-[#0b1220]">
            <h3 className="text-base font-bold text-white tracking-wide">Demo Modes</h3>
            <p className="mt-1 text-sm text-white">Alter display emphasis without regenerating data.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {[
                { key: "boardroom", label: "Boardroom Mode" },
                { key: "high_risk", label: "High Risk Scenario" },
                { key: "rapid_growth", label: "Rapid Growth Scenario" },
                { key: "investor_pitch", label: "Investor Pitch Mode" },
                { key: "ad_explosion", label: "Ad Explosion Mode" },
              ].map(({ key, label }) => (
                <Button key={key} variant={demoMode === key ? "primary" : "secondary"} size="sm" onClick={() => setDemoModePreset(demoMode === key ? null : key)} disabled={!currentSandboxId || demoModeLoading} className={demoMode === key ? "bg-blue-600 hover:bg-blue-500" : "bg-slate-700 text-white hover:bg-slate-600"}>
                  {label}
                </Button>
              ))}
              {demoMode && <span className="self-center text-sm text-white">Active: {demoMode}</span>}
            </div>
          </div>
        </details>

        <details className="group rounded-xl border border-slate-700 bg-[#0b1220] overflow-hidden">
          <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 font-semibold text-white bg-[#0b1220] hover:bg-slate-700">
            <span>Feature Toggles</span>
            <span className="text-white transition group-open:rotate-180">▼</span>
          </summary>
          <div className="border-t border-slate-700 px-4 py-4 bg-[#0b1220]">
            <h3 className="text-xl font-bold tracking-wide">Feature Toggles</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button variant="secondary" size="sm" onClick={syncFeatures} disabled={syncFeaturesLoading} className="bg-[#0b1220] text-white hover:bg-slate-700">{syncFeaturesLoading ? "…" : "Sync from production"}</Button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {features.map((f) => (
                <label key={f.id} className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-700 bg-[#0b1220] px-3 py-2 hover:bg-slate-700">
                  <input type="checkbox" checked={overrides[f.feature_key] ?? f.is_enabled} onChange={(e) => currentSandboxId && setFeatureOverride(f.feature_key, e.target.checked)} className="rounded" />
                  <span className="text-sm text-white">{f.feature_key}</span>
                </label>
              ))}
              {features.length === 0 && <p className="text-sm text-white">Sync from production to see flags.</p>}
            </div>
            <div className="mt-4 rounded-xl border border-slate-700 bg-[#0b1220] p-4">
              <h3 className="text-base font-bold text-white tracking-wide">View-As Mode</h3>
              <p className="mt-1 text-sm text-white">Simulate plan gating, feature access (sandbox-only).</p>
              <div className="mt-3 flex gap-2">
                {(["Admin", "Employer", "Employee"] as const).map((mode) => (
                  <Button key={mode} variant={viewAs === mode ? "primary" : "secondary"} onClick={() => setViewAs(mode)} className={viewAs === mode ? "bg-blue-600 hover:bg-blue-500" : "bg-slate-700 text-white hover:bg-slate-600"}>View as {mode}</Button>
                ))}
              </div>
              <p className="mt-2 text-sm text-white">Current: {viewAs}</p>
            </div>
          </div>
        </details>

        <details className="group rounded-xl border border-slate-700 bg-[#0b1220] overflow-hidden">
          <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 font-semibold text-white bg-[#0b1220] hover:bg-slate-700">
            <span>Actions</span>
            <span className="text-white transition group-open:rotate-180">▼</span>
          </summary>
          <div className="border-t border-slate-700 px-4 py-4 bg-[#0b1220]">
            <Button onClick={runCleanup} disabled={loading || cleanupLoading} className="w-full bg-red-600 py-2 font-semibold text-white hover:bg-red-500">
              {cleanupLoading ? "…" : "Cleanup expired sessions"}
            </Button>
          </div>
        </details>

        <details className="group rounded-xl border border-slate-700 bg-[#0b1220] overflow-hidden">
          <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 font-semibold text-white bg-[#0b1220] hover:bg-slate-700">
            <span>Command Console</span>
            <span className="text-white transition group-open:rotate-180">▼</span>
          </summary>
          <div className="border-t border-slate-700 px-4 py-4 bg-[#0b1220]">
            <div className="max-h-72 overflow-y-auto rounded-lg border border-slate-700 bg-[#0b1220] p-4 font-mono text-sm text-white">
              {consoleLogs.length === 0 && <p className="text-white">No output yet.</p>}
              {consoleLogs.map((line, i) => (
                <p key={i} className={line.startsWith("[ERR]") ? "text-red-400" : line.startsWith("[OK]") ? "text-emerald-400" : "text-white"}>{line}</p>
              ))}
            </div>
          </div>
        </details>
          </div>
          )}
        </div>

        {/* RIGHT: Live Results (30%) */}
        <LiveResultsPanel
          dashboardData={dashboardData}
          intelByEmployeeId={intelByEmployeeId}
          previousAvgHiringConfidence={previousAvgHiringConfidence}
          totalEmploymentRecords={ei?.employmentRecordsCount}
          consoleLogs={consoleLogs}
        />
      </div>
    </div>
  );
}
