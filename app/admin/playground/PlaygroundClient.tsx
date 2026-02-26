"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import ScenarioResult from "@/components/playground/ScenarioResult";
import ScenarioTimeline from "@/components/playground/ScenarioTimeline";
import EmployerImpact from "@/components/playground/EmployerImpact";
import ProductionEquivalent from "@/components/playground/ProductionEquivalent";
import TrustThreshold from "@/components/playground/TrustThreshold";
import ScenarioBuilder from "@/components/playground/ScenarioBuilder";
import AIScenarioGenerator from "@/components/playground/AIScenarioGenerator";
import ScenarioComparison from "@/components/playground/ScenarioComparison";
import EnterpriseLock from "@/components/playground/EnterpriseLock";
import { hasEnterpriseAccess } from "@/lib/enterprise";
import { useTrustEngine } from "@/lib/trust/useTrustEngine";
import { INDUSTRY_PROFILES, type ActorMode } from "@/lib/trust/types";
import { AI_PROMPT_TEMPLATES } from "@/lib/sandbox/aiPrompts";
import { PRICING_TIERS } from "@/lib/pricing";
import { ENTERPRISE_DEMO_SCRIPT } from "@/lib/salesDemo";
import { INVESTOR_NARRATIVE } from "@/lib/investorNarrative";

type ScenarioItem = { id: string; title: string };
type MockRole = "user" | "enterprise" | "superadmin";

export default function PlaygroundClient() {
  const searchParams = useSearchParams();
  const scenarioIdFromUrl = searchParams.get("scenarioId");
  const autoRunDoneRef = useRef<string | null>(null);

  const { state, derived, engineAction } = useTrustEngine();

  const [mockRole, setMockRole] = useState<MockRole>("user");
  const [scenarios, setScenarios] = useState<ScenarioItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [compareA, setCompareA] = useState<any>(null);
  const [compareB, setCompareB] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [aiTemplateLoading, setAiTemplateLoading] = useState(false);

  const enterprise = hasEnterpriseAccess(mockRole);

  useEffect(() => {
    const timer = setInterval(() => engineAction({ type: "tick" }), 1200);
    return () => clearInterval(timer);
  }, [engineAction]);

  const fetchScenarios = useCallback(async () => {
    try {
      const res = await fetch("/api/sandbox/list");
      if (!res.ok) throw new Error("Failed to load scenarios");
      const data = await res.json();
      setScenarios(Array.isArray(data) ? data : []);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch scenarios");
      setScenarios([]);
    }
  }, []);

  useEffect(() => {
    fetchScenarios();
  }, [fetchScenarios]);

  const runScenario = useCallback(
    async (id: string) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/sandbox/run-scenario", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ scenarioId: id }),
        });
        const payload = await res.json();
        if (!res.ok) throw new Error(payload?.error ?? "Run failed");
        engineAction({ type: "runScenario", payload });
        setSelectedId(id);
        const url = new URL(window.location.href);
        url.searchParams.set("scenarioId", id);
        window.history.replaceState({}, "", url.toString());
      } catch (e) {
        setError(e instanceof Error ? e.message : "Run failed");
      } finally {
        setLoading(false);
      }
    },
    [engineAction]
  );

  useEffect(() => {
    if (
      !scenarioIdFromUrl ||
      scenarios.length === 0 ||
      loading ||
      autoRunDoneRef.current === scenarioIdFromUrl
    )
      return;
    const exists = scenarios.some((s) => s.id === scenarioIdFromUrl);
    if (!exists) return;
    autoRunDoneRef.current = scenarioIdFromUrl;
    runScenario(scenarioIdFromUrl);
  }, [scenarioIdFromUrl, scenarios, runScenario, loading]);

  useEffect(() => {
    if (scenarioIdFromUrl && scenarios.some((s) => s.id === scenarioIdFromUrl)) {
      setSelectedId(scenarioIdFromUrl);
    }
  }, [scenarioIdFromUrl, scenarios]);

  const generateFromTemplate = useCallback(
    async (prompt: string) => {
      setAiTemplateLoading(true);
      try {
        await fetch("/api/sandbox/ai-generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt }),
        });
        await fetchScenarios();
        alert("AI scenario generated from template");
      } finally {
        setAiTemplateLoading(false);
      }
    },
    [fetchScenarios]
  );

  const exportJson = useCallback(() => {
    if (!state.lastRunResult) return;
    const json = JSON.stringify(state.lastRunResult, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "scenario.json";
    a.click();
    URL.revokeObjectURL(a.href);
  }, [state.lastRunResult]);

  const shareableUrl =
    typeof window !== "undefined" && state.lastRunResult
      ? `${window.location.origin}${window.location.pathname}?scenarioId=${state.lastRunResult.scenarioId ?? selectedId}`
      : "";

  const ex = derived.explainScore();

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Admin Playground</h1>
          <p className="text-slate-600 text-sm">
            AI-powered hiring simulation. Mock scenario outcomes, timeline, employer/candidate impact. Shareable URLs. Enterprise demo.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <span className="text-sm text-slate-600">Demo role:</span>
            <select
              value={mockRole}
              onChange={(e) => setMockRole(e.target.value as MockRole)}
              className="border rounded px-2 py-1 text-sm ml-1"
            >
              <option value="user">User (gated)</option>
              <option value="enterprise">Enterprise</option>
              <option value="superadmin">Superadmin</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Acting As</label>
            <select
              value={state.actorMode}
              onChange={(e) =>
                engineAction({ type: "setActorMode", actor: e.target.value as ActorMode })
              }
              className="border rounded px-3 py-2 text-sm"
            >
              <option value="admin">Admin</option>
              <option value="employer">Employer</option>
              <option value="worker">Worker</option>
            </select>
          </div>
        </div>
      </div>

      {state.actorMode === "employer" && (
        <div className="mb-6 rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="font-semibold text-slate-900 mb-3">Employer Actions</h2>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded bg-green-600 text-white px-3 py-2 text-sm hover:bg-green-700"
              onClick={() => {
                const reason = window.prompt("Reason for positive review (optional):") ?? "";
                engineAction({ type: "employerReview", kind: "positive", reason });
              }}
            >
              Add Positive Employer Review
            </button>
            <button
              type="button"
              className="rounded bg-amber-600 text-white px-3 py-2 text-sm hover:bg-amber-700"
              onClick={() => {
                const reason = window.prompt("Reason for negative review:") ?? "";
                engineAction({ type: "employerReview", kind: "negative", reason });
              }}
            >
              Add Negative Employer Review
            </button>
            <button
              type="button"
              className="rounded bg-orange-600 text-white px-3 py-2 text-sm hover:bg-orange-700"
              onClick={() => {
                const reason = window.prompt("Describe inconsistency:") ?? "";
                engineAction({ type: "flagInconsistency", reason });
              }}
            >
              Flag Inconsistency
            </button>
            <button
              type="button"
              className="rounded bg-slate-600 text-white px-3 py-2 text-sm hover:bg-slate-700"
              onClick={() => engineAction({ type: "retractEmployerReview" })}
            >
              Retract Employer Review
            </button>
            <select
              className="border rounded px-3 py-2 text-sm"
              defaultValue=""
              onChange={(e) => {
                const v = e.target.value as "low" | "medium" | "high" | "";
                if (v) engineAction({ type: "employerAbusePattern", severity: v });
                e.target.value = "";
              }}
            >
              <option value="">Report abuse pattern…</option>
              <option value="low">Abuse: Low</option>
              <option value="medium">Abuse: Medium</option>
              <option value="high">Abuse: High</option>
            </select>
          </div>
        </div>
      )}

      <div className="mb-6 rounded-lg border border-violet-200 bg-violet-50/50 p-4">
        <h2 className="font-semibold text-slate-900 mb-1">{INVESTOR_NARRATIVE.headline}</h2>
        <ul className="list-disc ml-5 text-sm text-slate-700 space-y-0.5">
          {INVESTOR_NARRATIVE.points.map((p, i) => (
            <li key={i}>{p}</li>
          ))}
        </ul>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <h2 className="font-semibold text-slate-900 mb-2">Why Enterprises Pay for This</h2>
          <ul className="list-disc ml-5 text-sm text-slate-700 space-y-1">
            <li>Predict hiring risk before interviews</li>
            <li>Simulate edge cases without production data</li>
            <li>Train recruiters on real scenarios</li>
            <li>Reduce false-positive background checks</li>
            <li>Audit hiring decisions with explainability</li>
          </ul>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <h2 className="font-semibold text-slate-900 mb-2">5-Min Enterprise Demo Script</h2>
          <ol className="list-decimal ml-5 text-sm text-slate-700 space-y-1">
            {ENTERPRISE_DEMO_SCRIPT.map((s) => (
              <li key={s.step}>
                <span className="font-medium">{s.title}:</span> {s.talk}
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50/50 p-4">
        <h2 className="font-semibold text-slate-900 mb-3">Playground Tiers</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {PRICING_TIERS.map((tier) => (
            <div key={tier.name} className="border rounded p-3 bg-white">
              <h3 className="font-medium">{tier.name}</h3>
              <p className="text-lg font-semibold text-slate-800">{tier.price}</p>
              <ul className="list-disc ml-4 text-xs text-slate-600 mt-1 space-y-0.5">
                {tier.features.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded bg-red-50 border border-red-200 text-red-700 px-4 py-2 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="border rounded-lg p-4 bg-white">
            <h2 className="font-semibold text-slate-900 mb-3">Scenario selector</h2>
            <ul className="space-y-2">
              {scenarios.length === 0 && !error && <li className="text-sm text-gray-500">Loading…</li>}
              {scenarios.map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-2">
                  <span className="text-sm truncate">{s.title}</span>
                  <button
                    type="button"
                    onClick={() => runScenario(s.id)}
                    disabled={loading}
                    className="shrink-0 px-4 py-2 border rounded bg-black text-white text-sm hover:bg-slate-800 disabled:opacity-50"
                  >
                    Run: {s.title}
                  </button>
                </li>
              ))}
            </ul>
            <div className="mt-6 space-y-2">
              <div><strong>Trust Score:</strong> {state.trustScore}</div>
              <div><strong>Profile Strength:</strong> {state.profileStrength}</div>
              <div><strong>Current Day:</strong> {state.currentDay}</div>
            </div>
            <div className="mt-4 space-y-2">
              <div className="text-3xl font-bold text-slate-900">Confidence Score: {state.confidenceScore}</div>
              <div className="text-sm">
                Likelihood of Passing ({state.employerMode}): <strong>{derived.simulateOutcomes()}%</strong>
              </div>
            </div>
            {state.events.length > 0 && (
              <div className="mt-6">
                <h3 className="font-semibold text-slate-900 mb-2">Trust Events</h3>
                <ul className="list-disc ml-5 text-sm text-slate-700 space-y-1">
                  {state.events.map((e, i) => (
                    <li key={i}>
                      [{e.day}] {e.type?.toUpperCase() ?? "EVENT"} – {e.message}
                      {e.impact != null && ` (${e.impact >= 0 ? "+" : ""}${e.impact})`}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="mt-4 p-3 rounded bg-slate-50 border border-slate-200">
              <h4 className="font-medium text-slate-900 mb-1">Explainability</h4>
              <p className="text-sm text-slate-700">{ex.reason}</p>
              <ul className="list-disc ml-5 mt-1 text-xs text-slate-600 space-y-0.5">
                {ex.improveBy.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">Industry</label>
              <select
                value={state.industry}
                onChange={(e) => engineAction({ type: "setIndustry", industry: e.target.value as keyof typeof INDUSTRY_PROFILES })}
                className="border rounded px-3 py-2 text-sm"
              >
                <option value="healthcare">Healthcare</option>
                <option value="construction">Construction</option>
                <option value="retail">Retail</option>
                <option value="security">Security</option>
              </select>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">Employer mode</label>
              <select
                value={state.employerMode}
                onChange={(e) => engineAction({ type: "setEmployerMode", mode: e.target.value as "smb" | "mid" | "enterprise" })}
                className="border rounded px-3 py-2 text-sm"
              >
                <option value="smb">SMB</option>
                <option value="mid">Mid-Market</option>
                <option value="enterprise">Enterprise</option>
              </select>
              <div className="mt-2">
                <strong>Employer Verdict:</strong>{" "}
                {derived.passesEmployer ? "✅ PASS" : "❌ FAIL"}
              </div>
            </div>
            <div className="mt-4">
              <button
                type="button"
                className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700"
                onClick={() => engineAction({ type: "triggerFraud", reason: "Employer dispute detected" })}
              >
                Trigger Fraud Rollback
              </button>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">Employer explanation (AI-ready)</label>
              <textarea
                readOnly
                rows={14}
                className="w-full border rounded px-3 py-2 text-sm font-mono bg-slate-50 text-slate-800"
                value={derived.generateEmployerExplanation()}
              />
            </div>
          </div>

          {enterprise ? (
            <>
              <div className="border rounded p-4 bg-white">
                <h3 className="font-semibold text-slate-900 mb-2">AI prompt templates</h3>
                <select
                  className="border w-full p-2 rounded text-sm"
                  value=""
                  onChange={(e) => {
                    const id = e.target.value;
                    if (!id) return;
                    const t = AI_PROMPT_TEMPLATES.find((x) => x.id === id);
                    if (t) generateFromTemplate(t.prompt);
                    e.target.value = "";
                  }}
                  disabled={aiTemplateLoading}
                >
                  <option value="">Generate from template…</option>
                  {AI_PROMPT_TEMPLATES.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
                {aiTemplateLoading && <p className="text-xs text-slate-500 mt-1">Generating…</p>}
              </div>
              <AIScenarioGenerator onGenerated={fetchScenarios} />
            </>
          ) : (
            <>
              <EnterpriseLock feature="AI prompt templates" />
              <EnterpriseLock feature="AI Scenario Generator" />
            </>
          )}

          {enterprise ? (
            <TrustThreshold
              threshold={state.threshold}
              setThreshold={(n) => engineAction({ type: "setThreshold", value: n })}
            />
          ) : (
            <EnterpriseLock feature="Trust Threshold Simulation" />
          )}

          <ScenarioBuilder />

          {enterprise ? (
            <div className="border rounded-lg p-4 bg-white">
              <h2 className="font-semibold text-slate-900 mb-2">Scenario comparison (A vs B)</h2>
              {state.lastRunResult && (
                <div className="flex gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => setCompareA(state.lastRunResult)}
                    className="text-xs rounded bg-slate-200 px-2 py-1 hover:bg-slate-300"
                  >
                    Use as A
                  </button>
                  <button
                    type="button"
                    onClick={() => setCompareB(state.lastRunResult)}
                    className="text-xs rounded bg-slate-200 px-2 py-1 hover:bg-slate-300"
                  >
                    Use as B
                  </button>
                </div>
              )}
              <ScenarioComparison a={compareA} b={compareB} />
              {!compareA && !compareB && (
                <p className="text-sm text-slate-500">Run a scenario, then set A and B to compare.</p>
              )}
            </div>
          ) : (
            <EnterpriseLock feature="Scenario Comparison" />
          )}
        </div>

        <div className="space-y-6">
          {state.lastRunResult && (
            <>
              <ScenarioResult result={state.lastRunResult} />
              <ScenarioTimeline events={state.events} />

              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-600">View:</span>
                <button
                  type="button"
                  onClick={() => engineAction({ type: "setView", view: "employer" })}
                  className={`px-3 py-1 rounded text-sm ${state.view === "employer" ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600"}`}
                >
                  Employer
                </button>
                <button
                  type="button"
                  onClick={() => engineAction({ type: "setView", view: "candidate" })}
                  className={`px-3 py-1 rounded text-sm ${state.view === "candidate" ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600"}`}
                >
                  Candidate
                </button>
              </div>
              <EmployerImpact
                result={state.lastRunResult}
                view={state.view}
                threshold={state.threshold}
              />
              <ProductionEquivalent />

              {enterprise ? (
                <>
                  <div className="space-y-2">
                    <h3 className="font-semibold text-slate-900 text-sm">Shareable link</h3>
                    <p className="text-xs text-slate-500 break-all">{shareableUrl || "Run a scenario to get a link."}</p>
                    <button
                      type="button"
                      onClick={() => shareableUrl && navigator.clipboard?.writeText(shareableUrl)}
                      className="text-xs rounded bg-slate-600 text-white px-2 py-1"
                    >
                      Copy link
                    </button>
                  </div>
                  <details className="mt-2 rounded border border-slate-200 bg-slate-50 p-2">
                    <summary className="cursor-pointer text-xs font-medium text-slate-600">Debug: Export scenario JSON</summary>
                    <button
                      type="button"
                      onClick={exportJson}
                      disabled={!state.lastRunResult}
                      className="mt-2 rounded bg-slate-600 text-white px-3 py-1.5 text-xs hover:bg-slate-700 disabled:opacity-50"
                    >
                      Export scenario.json
                    </button>
                  </details>
                </>
              ) : (
                <>
                  <EnterpriseLock feature="Shareable Links" />
                  <EnterpriseLock feature="Export JSON" />
                </>
              )}
            </>
          )}
          {!state.lastRunResult && !loading && (
            <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-slate-500 text-sm">
              Run a scenario to see outcome, timeline, and impact. Open a link with ?scenarioId= to auto-run.
            </div>
          )}
          {loading && (
            <div className="rounded-lg border p-6 text-center text-slate-500 text-sm">
              Running scenario…
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
