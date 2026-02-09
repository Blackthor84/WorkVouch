"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ENABLED_VERTICALS, industryToVerticalName } from "@/lib/config/verticals";
import { INDUSTRIES } from "@/lib/constants/industries";
import { VerticalOnboardingFields, type VerticalFieldValues } from "@/components/verticals/VerticalOnboardingFields";

type Employer = { id: string; company_name?: string; industry?: string; plan_tier?: string };
type Employee = { id: string; full_name?: string; industry?: string };
type IntelOutput = { employee_id: string; profile_strength?: number | null };

const COLLAPSE_ICON = "▸";
const COLLAPSE_ICON_OPEN = "▾";

interface ControlPanelProps {
  currentSandboxId: string | null;
  loading: boolean;
  createName: string;
  setCreateName: (v: string) => void;
  createLoading: boolean;
  sessions: { id: string; name: string | null; status: string }[];
  onCreateSession: () => void;
  onSessionChange: (id: string | null) => void;
  employers: Employer[];
  employees: Employee[];
  intelByEmployeeId: Map<string, IntelOutput>;
  employerName: string;
  setEmployerName: (v: string) => void;
  employerIndustry: string;
  setEmployerIndustry: (v: string) => void;
  employerPlanTier: string;
  setEmployerPlanTier: (v: string) => void;
  employeeName: string;
  setEmployeeName: (v: string) => void;
  employeeIndustry: string;
  setEmployeeIndustry: (v: string) => void;
  employeeVerticalMetadata: Record<string, unknown>;
  setEmployeeVerticalMetadata: (v: Record<string, unknown>) => void;
  /** Vertical names enabled in platform_verticals (e.g. education, construction). When set, vertical onboarding is only shown when selected industry maps to an enabled vertical. */
  enabledVerticalNames?: string[];
  genEmployerLoading: boolean;
  genEmployeeLoading: boolean;
  onGenerateEmployer: () => void;
  onGenerateEmployee: () => void;
  teachersMode: boolean;
  peerReviewerId: string;
  setPeerReviewerId: (v: string) => void;
  peerReviewedId: string;
  setPeerReviewedId: (v: string) => void;
  peerRating: number;
  setPeerRating: (v: number) => void;
  peerReviewText: string;
  setPeerReviewText: (v: string) => void;
  peerReviewLoading: boolean;
  reviewedCandidates: Employee[];
  submittedReviews: { id: string; reviewerName: string; reviewedName: string; rating: number; review_text: string | null }[];
  onAddPeerReview: () => void;
  onClearSubmittedReviews: () => void;
  hireEmployeeId: string;
  setHireEmployeeId: (v: string) => void;
  hireEmployerId: string;
  setHireEmployerId: (v: string) => void;
  hireRole: string;
  setHireRole: (v: string) => void;
  hireTenureMonths: number;
  setHireTenureMonths: (v: number) => void;
  hireRehireEligible: boolean;
  setHireRehireEligible: (v: boolean) => void;
  hireLoading: boolean;
  onAddEmployment: () => void;
  adsEmployerId: string;
  setAdsEmployerId: (v: string) => void;
  adsImpressions: number;
  setAdsImpressions: (v: number) => void;
  adsClicks: number;
  setAdsClicks: (v: number) => void;
  adsSpend: number;
  setAdsSpend: (v: number) => void;
  adsLoading: boolean;
  onAddAds: () => void;
  churnRate: number;
  setChurnRate: (v: number) => void;
  revenueLoading: boolean;
  onUpdateRevenue: () => void;
}

export function ControlPanel(props: ControlPanelProps) {
  const {
    currentSandboxId,
    loading,
    createName,
    setCreateName,
    createLoading,
    sessions,
    onCreateSession,
    onSessionChange,
    employers,
    employees,
    intelByEmployeeId,
    employerName,
    setEmployerName,
    employerIndustry,
    setEmployerIndustry,
    employerPlanTier,
    setEmployerPlanTier,
    employeeName,
    setEmployeeName,
    employeeIndustry,
    setEmployeeIndustry,
    employeeVerticalMetadata,
    setEmployeeVerticalMetadata,
    genEmployerLoading,
    genEmployeeLoading,
    onGenerateEmployer,
    onGenerateEmployee,
    teachersMode,
    peerReviewerId,
    setPeerReviewerId,
    peerReviewedId,
    setPeerReviewedId,
    peerRating,
    setPeerRating,
    peerReviewText,
    setPeerReviewText,
    peerReviewLoading,
    reviewedCandidates,
    submittedReviews,
    onAddPeerReview,
    onClearSubmittedReviews,
    hireEmployeeId,
    setHireEmployeeId,
    hireEmployerId,
    setHireEmployerId,
    hireRole,
    setHireRole,
    hireTenureMonths,
    setHireTenureMonths,
    hireRehireEligible,
    setHireRehireEligible,
    hireLoading,
    onAddEmployment,
    adsEmployerId,
    setAdsEmployerId,
    adsImpressions,
    setAdsImpressions,
    adsClicks,
    setAdsClicks,
    adsSpend,
    setAdsSpend,
    adsLoading,
    onAddAds,
    churnRate,
    setChurnRate,
    revenueLoading,
    onUpdateRevenue,
  } = props;

  const enabledVerticalNames = ENABLED_VERTICALS;

  const cardBase = "rounded-xl border border-slate-700 bg-slate-900 overflow-hidden shadow-xl";
  const cardHead = "flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 font-semibold text-white bg-slate-900 border-b border-slate-700 hover:bg-slate-800/90";
  const cardBody = "border-t border-slate-700 bg-slate-900/95 px-4 py-4 space-y-3";
  const inputClass = "rounded border border-slate-600 bg-slate-800 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500";
  const labelClass = "text-slate-300 font-medium";

  return (
    <aside className="flex flex-col gap-4 overflow-y-auto">
      {/* Session Control — visually dominant */}
      <section className={cardBase}>
        <details open className="group">
          <summary className={cardHead}>
            <span className="flex items-center gap-2">
              <span className="text-blue-400">{COLLAPSE_ICON_OPEN}</span>
              Session Control
            </span>
            <span className="text-slate-400 text-sm group-open:rotate-180">{COLLAPSE_ICON}</span>
          </summary>
          <div className={cardBody}>
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <Label className={labelClass}>New session name</Label>
                <Input
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="Session name"
                  className={`mt-1 w-44 ${inputClass}`}
                />
              </div>
              <Button
                onClick={onCreateSession}
                disabled={loading || createLoading}
                className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-5 py-2"
              >
                {createLoading ? "…" : "Create Session"}
              </Button>
            </div>
            <div>
              <Label className={labelClass}>Active session</Label>
              <select
                value={currentSandboxId ?? ""}
                onChange={(e) => onSessionChange(e.target.value || null)}
                className={`mt-1 w-full rounded border border-slate-600 bg-slate-800 px-3 py-2 text-white ${inputClass}`}
              >
                <option value="">None</option>
                {sessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name || s.id.slice(0, 8)} — {s.status}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </details>
      </section>

      {/* Employer Generator */}
      <section className={cardBase}>
        <details className="group">
          <summary className={cardHead}>
            <span className="flex items-center gap-2">
              <span className="text-blue-400">{COLLAPSE_ICON}</span>
              Employer Generator
            </span>
            <span className="text-slate-400 text-sm group-open:rotate-180">{COLLAPSE_ICON}</span>
          </summary>
          <div className={cardBody}>
            <div className="space-y-2">
              <div>
                <Label className={labelClass}>Company name</Label>
                <Input value={employerName} onChange={(e) => setEmployerName(e.target.value)} placeholder="Name" className={`mt-1 ${inputClass}`} />
              </div>
              <div>
                <Label className={labelClass}>Industry</Label>
                <select
                  value={employerIndustry}
                  onChange={(e) => setEmployerIndustry(e.target.value)}
                  className="mt-1 w-full rounded border border-slate-600 bg-slate-800 px-3 py-2 text-white"
                >
                  <option value="">Select industry</option>
                  {INDUSTRIES.map((ind) => (
                    <option key={ind} value={ind}>
                      {ind}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label className={labelClass}>Plan tier</Label>
                <select
                  value={employerPlanTier}
                  onChange={(e) => setEmployerPlanTier(e.target.value)}
                  className={`mt-1 w-full ${inputClass} px-3 py-2`}
                >
                  <option value="starter">Starter</option>
                  <option value="pro">Pro</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>
              <Button
                onClick={onGenerateEmployer}
                disabled={loading || !currentSandboxId || genEmployerLoading}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white"
              >
                {genEmployerLoading ? "…" : "Generate employer"}
              </Button>
            </div>
          </div>
        </details>
      </section>

      {/* Employee Generator */}
      <section className={cardBase}>
        <details className="group">
          <summary className={cardHead}>
            <span className="flex items-center gap-2">
              <span className="text-blue-400">{COLLAPSE_ICON}</span>
              Employee Generator
            </span>
            <span className="text-slate-400 text-sm group-open:rotate-180">{COLLAPSE_ICON}</span>
          </summary>
          <div className={cardBody}>
            <div className="space-y-2">
              <div>
                <Label className={labelClass}>Full name</Label>
                <Input value={employeeName} onChange={(e) => setEmployeeName(e.target.value)} placeholder="Name" className={`mt-1 ${inputClass}`} />
              </div>
              <div>
                <Label className={labelClass}>Industry</Label>
                <select
                  value={employeeIndustry}
                  onChange={(e) => setEmployeeIndustry(e.target.value)}
                  className="mt-1 w-full rounded border border-slate-600 bg-slate-800 px-3 py-2 text-white"
                >
                  <option value="">Select industry</option>
                  {INDUSTRIES.map((ind) => (
                    <option key={ind} value={ind}>
                      {ind}
                    </option>
                  ))}
                </select>
              </div>
              {employeeIndustry &&
              (enabledVerticalNames.length === 0 ||
                enabledVerticalNames.includes(industryToVerticalName(employeeIndustry))) ? (
                <VerticalOnboardingFields
                  industry={employeeIndustry}
                  value={(employeeVerticalMetadata || {}) as VerticalFieldValues}
                  onChange={(v) => setEmployeeVerticalMetadata(v)}
                  mode="employee"
                  className="mt-2"
                />
              ) : null}
              <Button
                onClick={onGenerateEmployee}
                disabled={loading || !currentSandboxId || genEmployeeLoading}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white"
              >
                {genEmployeeLoading ? "…" : "Generate employee"}
              </Button>
            </div>
          </div>
        </details>
      </section>

      {/* Peer Review Builder */}
      <section className={cardBase}>
        <details open className="group">
          <summary className={cardHead}>
            <span className="flex items-center gap-2">
              <span className="text-blue-400">{COLLAPSE_ICON}</span>
              Peer Review Builder
            </span>
            <span className="text-slate-400 text-sm group-open:rotate-180">{COLLAPSE_ICON}</span>
          </summary>
          <div className={cardBody}>
            <p className="text-xs text-slate-400">✔ Verified overlap required. Self-review blocked.</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label className={labelClass}>Reviewer (Gives feedback)</Label>
                <select
                  value={peerReviewerId}
                  onChange={(e) => {
                    const next = e.target.value;
                    setPeerReviewerId(next);
                    if (next && peerReviewedId === next) setPeerReviewedId("");
                  }}
                  className={`mt-1 w-full ${inputClass} px-3 py-2`}
                >
                  <option value="">Select employee</option>
                  {employees.length === 0 && <option disabled>No employees yet</option>}
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>{e.full_name ?? e.id.slice(0, 8)}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label className={labelClass}>Reviewed Employee (Receives feedback)</Label>
                <select
                  value={peerReviewedId}
                  onChange={(e) => setPeerReviewedId(e.target.value)}
                  className={`mt-1 w-full ${inputClass} px-3 py-2 ${peerReviewerId && peerReviewedId === peerReviewerId ? "ring-2 ring-red-500" : ""}`}
                >
                  <option value="">Select employee</option>
                  {reviewedCandidates.length === 0 && <option disabled>No other employees (or select reviewer first)</option>}
                  {reviewedCandidates.map((e) => (
                    <option key={e.id} value={e.id}>{e.full_name ?? e.id.slice(0, 8)}</option>
                  ))}
                </select>
                {peerReviewerId && peerReviewedId === peerReviewerId && (
                  <p className="mt-1 text-xs text-red-400">Self-review not allowed.</p>
                )}
              </div>
            </div>
            <div>
              <Label className={labelClass}>Rating (1–5): {peerRating}</Label>
              <input
                type="range"
                min={1}
                max={5}
                step={1}
                value={peerRating}
                onChange={(e) => setPeerRating(parseInt(e.target.value, 10))}
                className="mt-2 w-full accent-blue-500"
              />
            </div>
            <div>
              <Label className={labelClass}>Review text</Label>
              <Input
                value={peerReviewText}
                onChange={(e) => setPeerReviewText(e.target.value)}
                placeholder="Review text (sentiment auto-calculated)"
                className={`mt-1 ${inputClass}`}
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={onAddPeerReview}
                disabled={loading || !currentSandboxId || !peerReviewerId || !peerReviewedId || peerReviewLoading}
                className="bg-blue-600 hover:bg-blue-500 text-white"
              >
                {peerReviewLoading ? "…" : "Add peer review"}
              </Button>
              <Button variant="secondary" onClick={onClearSubmittedReviews} disabled={submittedReviews.length === 0} className="bg-slate-700 text-slate-200 hover:bg-slate-600">
                Clear Reviews
              </Button>
            </div>
            {submittedReviews.length > 0 && (
              <div className="rounded-lg border border-slate-700 bg-slate-800 p-3">
                <p className="mb-2 text-sm font-medium text-slate-300">Submitted reviews ({submittedReviews.length})</p>
                <ul className="max-h-36 space-y-2 overflow-y-auto text-sm text-white">
                  {submittedReviews.map((r) => (
                    <li key={r.id} className="rounded border border-slate-600 bg-slate-800 p-2">
                      <span className="font-medium">{r.reviewerName}</span> → <span className="font-medium">{r.reviewedName}</span> · {r.rating}/5
                      {r.review_text && <p className="mt-1 truncate text-slate-400">{r.review_text}</p>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </details>
      </section>

      {/* Hiring Simulation */}
      <section className={cardBase}>
        <details className="group">
          <summary className={cardHead}>
            <span className="flex items-center gap-2">
              <span className="text-blue-400">{COLLAPSE_ICON}</span>
              Hiring Simulation
            </span>
            <span className="text-slate-400 text-sm group-open:rotate-180">{COLLAPSE_ICON}</span>
          </summary>
          <div className={cardBody}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label className={labelClass}>Employee</Label>
                <select value={hireEmployeeId} onChange={(e) => setHireEmployeeId(e.target.value)} className={`mt-1 w-full ${inputClass} px-3 py-2`}>
                  <option value="">Select employee</option>
                  {employees.length === 0 && <option disabled>No employees yet</option>}
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>{e.full_name ?? e.id.slice(0, 8)}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label className={labelClass}>Employer</Label>
                <select value={hireEmployerId} onChange={(e) => setHireEmployerId(e.target.value)} className={`mt-1 w-full ${inputClass} px-3 py-2`}>
                  <option value="">Select employer</option>
                  {employers.map((e) => (
                    <option key={e.id} value={e.id}>{e.company_name ?? e.id.slice(0, 8)}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <div>
                <Label className={labelClass}>Role</Label>
                <Input value={hireRole} onChange={(e) => setHireRole(e.target.value)} placeholder="Role" className={`mt-1 w-32 ${inputClass}`} />
              </div>
              <div>
                <Label className={labelClass}>Tenure (months)</Label>
                <Input
                  type="number"
                  value={hireTenureMonths}
                  onChange={(e) => setHireTenureMonths(parseInt(e.target.value, 10) || 0)}
                  className={`mt-1 w-24 ${inputClass}`}
                />
              </div>
              <label className="flex items-center gap-2 text-slate-300">
                <input type="checkbox" checked={hireRehireEligible} onChange={(e) => setHireRehireEligible(e.target.checked)} className="rounded" />
                Rehire eligible
              </label>
            </div>
            <Button
              onClick={onAddEmployment}
              disabled={loading || !currentSandboxId || !hireEmployeeId || !hireEmployerId || hireLoading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              {hireLoading ? "…" : "Add Employment"}
            </Button>
          </div>
        </details>
      </section>

      {/* Ads Simulation */}
      <section className={cardBase}>
        <details className="group">
          <summary className={cardHead}>
            <span className="flex items-center gap-2">
              <span className="text-blue-400">{COLLAPSE_ICON}</span>
              Ads Simulation
            </span>
            <span className="text-slate-400 text-sm group-open:rotate-180">{COLLAPSE_ICON}</span>
          </summary>
          <div className={cardBody}>
            <div className="flex flex-wrap gap-3">
              <div>
                <Label className={labelClass}>Employer</Label>
                <select value={adsEmployerId} onChange={(e) => setAdsEmployerId(e.target.value)} className={`mt-1 w-36 ${inputClass} px-3 py-2`}>
                  <option value="">Optional</option>
                  {employers.map((e) => (
                    <option key={e.id} value={e.id}>{e.company_name ?? e.id.slice(0, 8)}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label className={labelClass}>Impressions</Label>
                <Input type="number" value={adsImpressions} onChange={(e) => setAdsImpressions(parseInt(e.target.value, 10) || 0)} className={`mt-1 w-24 ${inputClass}`} />
              </div>
              <div>
                <Label className={labelClass}>Clicks</Label>
                <Input type="number" value={adsClicks} onChange={(e) => setAdsClicks(parseInt(e.target.value, 10) || 0)} className={`mt-1 w-24 ${inputClass}`} />
              </div>
              <div>
                <Label className={labelClass}>Spend</Label>
                <Input type="number" value={adsSpend} onChange={(e) => setAdsSpend(parseFloat(e.target.value) || 0)} className={`mt-1 w-24 ${inputClass}`} />
              </div>
            </div>
            <Button onClick={onAddAds} disabled={loading || !currentSandboxId || adsLoading} className="w-full bg-blue-600 hover:bg-blue-500 text-white">
              {adsLoading ? "…" : "Add ad campaign"}
            </Button>
          </div>
        </details>
      </section>

      {/* Revenue Simulation */}
      <section className={cardBase}>
        <details className="group">
          <summary className={cardHead}>
            <span className="flex items-center gap-2">
              <span className="text-blue-400">{COLLAPSE_ICON}</span>
              Revenue Simulation
            </span>
            <span className="text-slate-400 text-sm group-open:rotate-180">{COLLAPSE_ICON}</span>
          </summary>
          <div className={cardBody}>
            <div>
              <Label className={labelClass}>Churn rate: {(churnRate * 100).toFixed(0)}%</Label>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={churnRate}
                onChange={(e) => setChurnRate(parseFloat(e.target.value))}
                className="mt-2 w-full accent-blue-500"
              />
            </div>
            <Button onClick={onUpdateRevenue} disabled={loading || !currentSandboxId || revenueLoading} className="w-full bg-blue-600 hover:bg-blue-500 text-white">
              {revenueLoading ? "…" : "Update revenue"}
            </Button>
          </div>
        </details>
      </section>
    </aside>
  );
}
