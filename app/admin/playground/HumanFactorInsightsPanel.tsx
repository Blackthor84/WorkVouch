"use client";

import { useState } from "react";
import type { HumanFactorInsights as HumanFactorInsightsType, HumanFactorFactor } from "@/lib/trust/types";
import { industryLabel } from "@/lib/industries";
import type { Industry } from "@/lib/industries";
import {
  IconLayeredNodes,
  IconLoopedChain,
  IconParallelLines,
  IconIntersectingPaths,
  IconClockPause,
  IconNetworkBurst,
  IconChevronDown,
  IconChevronRight,
} from "./HumanFactorsIcons";

const MAIN_FACTORS = ["Relational Trust", "Collaboration Stability", "Workplace Friction Index"] as const;
const ADVANCED_FACTORS = ["Ethical Friction", "Social Gravity"] as const;

const DISPLAY_NAMES: Record<string, string> = {
  "Relational Trust": "Peer Re-Engagement Stability",
  "Collaboration Stability": "Signal Consistency Index",
  "Workplace Friction Index": "Coordination Cost Index",
  "Ethical Friction": "Verification Friction Indicator",
  "Social Gravity": "Influence Propagation Factor",
};

/** Collapsed one-liner; language-safe (allowed verbs only, no forbidden terms). */
const COLLAPSED_ONELINER: Record<string, string> = {
  "Relational Trust": "Peers repeatedly choose to re-engage.",
  "Collaboration Stability": "Signals are consistent over time.",
  "Workplace Friction Index": "Coordination cost derived from signal spread and recency.",
  "Ethical Friction": "Reflects timing and consistency of formal verification under procedural review.",
  "Social Gravity": "Models how trust-related signals propagate through the network.",
};

/** Expanded description; language-safe. */
const EXPANDED_DESCRIPTION: Record<string, string> = {
  "Relational Trust":
    "Indicates whether peers have repeatedly chosen to work with this employee across roles or organizations. This reflects observable re-engagement behavior.",
  "Collaboration Stability":
    "Measures the stability of trust-related signals over time and across environments. Consistency reflects reduced volatility.",
  "Workplace Friction Index":
    "Represents the estimated coordination overhead associated with conflicting or reversing signals. This impacts productivity modeling and does not assign intent.",
  "Ethical Friction":
    "Reflects timing and consistency of formal verification actions under procedural review. Delays or hesitations are treated as process signals.",
  "Social Gravity":
    "Models how trust-related signals propagate through a network based on connectivity and reviewer context. This amplifies downstream impact.",
};

/** Human-readable signal labels only (no numbers, no scores). */
const DISPLAY_SIGNALS: Record<string, string[]> = {
  "Relational Trust": ["Repeat peer reviews", "Review recency", "Cross-team endorsements"],
  "Collaboration Stability": ["Signal volatility (gap variance)", "Signals over time"],
  "Workplace Friction Index": ["Signal spread and age", "Signal disagreement and decay"],
  "Ethical Friction": ["Supervisor verification timing", "Verification span", "Inconsistent supervisory signals"],
  "Social Gravity": ["Network strength", "Reviewer seniority weighting", "Supervisor-derived weight"],
};

/** Verbatim tooltips per spec. */
const PANEL_TOOLTIP =
  "These indicators model how observable behavior patterns affect trust, risk, and outcomes. They are derived from documented signals and events, not personality traits, character judgments, or subjective opinions.";

const FACTOR_TOOLTIPS: Record<string, string> = {
  "Relational Trust":
    "Indicates whether peers have repeatedly chosen to work with this employee across roles or organizations. This reflects observable re-engagement behavior, not personal likability or social preference.",
  "Collaboration Stability":
    "Measures the stability of trust-related signals over time and across environments. Consistency reflects reduced volatility, not performance quality or personal attributes.",
  "Workplace Friction Index":
    "Represents the estimated coordination overhead associated with conflicting or reversing signals. This impacts productivity modeling and does not assign trust, blame, or intent.",
  "Ethical Friction":
    "Reflects timing and consistency of formal verification actions under procedural review. Delays or hesitations are treated as process signals and do not imply ethical judgment or intent.",
  "Social Gravity":
    "Models how trust-related signals propagate through a network based on connectivity and reviewer context. This amplifies downstream impact without indicating authority, popularity, or merit.",
};

function neutralSignals(factorName: string): string[] {
  return DISPLAY_SIGNALS[factorName] ?? ["Observable signals"];
}

function FactorIcon({ factorName, className }: { factorName: string; className?: string }) {
  const displayName = DISPLAY_NAMES[factorName] ?? factorName;
  if (displayName === "Peer Re-Engagement Stability") return <IconLoopedChain className={className} />;
  if (displayName === "Signal Consistency Index") return <IconParallelLines className={className} />;
  if (displayName === "Coordination Cost Index") return <IconIntersectingPaths className={className} />;
  if (displayName === "Verification Friction Indicator") return <IconClockPause className={className} />;
  if (displayName === "Influence Propagation Factor") return <IconNetworkBurst className={className} />;
  return null;
}

type Props = {
  humanFactorInsights: HumanFactorInsightsType | null | undefined;
  industry?: Industry;
  showAdvancedCompliance?: boolean;
  onAuditTrailClick?: (factorName: string) => void;
  onROIImpactClick?: (factorName: string) => void;
};

function FactorAccordionCard({
  factor,
  defaultOpen,
  onAuditTrailClick,
  onROIImpactClick,
}: {
  factor: HumanFactorFactor;
  defaultOpen: boolean;
  onAuditTrailClick?: (factorName: string) => void;
  onROIImpactClick?: (factorName: string) => void;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const displayName = DISPLAY_NAMES[factor.name] ?? factor.name;
  const oneLiner = COLLAPSED_ONELINER[factor.name] ?? factor.explanation;
  const description = EXPANDED_DESCRIPTION[factor.name] ?? factor.explanation;
  const signalsDisplay = neutralSignals(factor.name);
  const tooltip = FACTOR_TOOLTIPS[factor.name];

  return (
    <div className="border-b border-slate-200 last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-slate-50/80 transition-colors rounded"
        aria-expanded={open}
        title={tooltip}
      >
        <span className="flex-shrink-0 text-slate-400" aria-hidden>
          {open ? <IconChevronDown /> : <IconChevronRight />}
        </span>
        <span className="flex-shrink-0 mt-0.5">
          <FactorIcon factorName={factor.name} />
        </span>
        <div className="flex-1 min-w-0">
          <span className="text-sm font-medium text-slate-800">{displayName}</span>
          {!open && <p className="text-xs text-slate-600 mt-0.5 truncate">{oneLiner}</p>}
        </div>
      </button>
      {open && (
        <div className="px-3 pb-3 pt-0 pl-11 space-y-2.5 text-xs text-slate-700">
          <div>
            <h5 className="font-medium text-slate-600 mb-0.5">Description</h5>
            <p>{description}</p>
          </div>
          <div>
            <h5 className="font-medium text-slate-600 mb-0.5">Contributing signals</h5>
            <ul className="list-disc list-inside space-y-0.5">
              {signalsDisplay.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>
          <div>
            <h5 className="font-medium text-slate-600 mb-0.5">Observed effects</h5>
            <ul className="list-disc list-inside space-y-0.5">
              {factor.effectsApplied.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          </div>
          <div className="flex flex-wrap gap-3 pt-1">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onAuditTrailClick?.(factor.name); }}
              className="text-slate-600 underline hover:text-slate-800"
            >
              Audit Trail →
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onROIImpactClick?.(factor.name); }}
              className="text-slate-600 underline hover:text-slate-800"
            >
              ROI Impact →
            </button>
          </div>
          <p className="text-slate-500 italic">Human-readable, causal, auditable, defensible.</p>
        </div>
      )}
    </div>
  );
}

export function HumanFactorInsightsPanel({
  humanFactorInsights,
  industry,
  showAdvancedCompliance = false,
  onAuditTrailClick,
  onROIImpactClick,
}: Props) {
  const [advancedOpen, setAdvancedOpen] = useState(false);

  if (!humanFactorInsights?.factors?.length) return null;

  const mainFactors = humanFactorInsights.factors.filter((f) => MAIN_FACTORS.includes(f.name as (typeof MAIN_FACTORS)[number]));
  const advancedFactors = humanFactorInsights.factors.filter((f) => ADVANCED_FACTORS.includes(f.name as (typeof ADVANCED_FACTORS)[number]));

  return (
    <div
      className="rounded-lg border border-slate-200 bg-white overflow-hidden"
      title={PANEL_TOOLTIP}
    >
      <div className="px-3 py-2.5 border-b border-slate-200 bg-slate-50/50 flex items-start gap-2">
        <IconLayeredNodes className="flex-shrink-0 mt-0.5" />
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-slate-800">Human Factors (Modeled)</h3>
          <p className="text-xs text-slate-600 mt-0.5">Derived from observable behavior — not personality judgments.</p>
          {industry != null && (
            <p className="text-xs text-slate-500 mt-1.5">
              <span className="font-medium text-slate-600">Industry Context:</span> {industryLabel(industry)}. Sensitivity adjusted for safety and compliance.
            </p>
          )}
        </div>
      </div>

      <div className="divide-y divide-slate-100">
        {mainFactors.map((factor) => (
          <FactorAccordionCard
            key={factor.name}
            factor={factor}
            defaultOpen={false}
            onAuditTrailClick={onAuditTrailClick}
            onROIImpactClick={onROIImpactClick}
          />
        ))}
      </div>

      {showAdvancedCompliance && advancedFactors.length > 0 && (
        <>
          <div
            className="px-3 py-2 border-t border-l-4 border-slate-300 bg-slate-100/70"
            title="These indicators amplify downstream risk and are intended for compliance and audit contexts. Not shown to standard employers."
          >
            <button
              type="button"
              onClick={() => setAdvancedOpen(!advancedOpen)}
              className="flex items-center gap-2 w-full text-left"
              aria-expanded={advancedOpen}
            >
              <span className="text-slate-500">{advancedOpen ? <IconChevronDown /> : <IconChevronRight />}</span>
              <span className="text-xs font-medium text-slate-600">Advanced / Compliance View</span>
              <span className="text-[10px] uppercase tracking-wide text-slate-500 bg-slate-200/80 px-1.5 py-0.5 rounded">
                Compliance
              </span>
            </button>
            <p className="text-xs text-slate-500 mt-1 pl-6">
              These indicators amplify downstream risk and are intended for compliance and audit contexts.
            </p>
          </div>
          {advancedOpen && (
            <div className="border-t border-slate-200 bg-slate-50/50">
              {advancedFactors.map((factor) => (
                <FactorAccordionCard
                  key={factor.name}
                  factor={factor}
                  defaultOpen={false}
                  onAuditTrailClick={onAuditTrailClick}
                  onROIImpactClick={onROIImpactClick}
                />
              ))}
            </div>
          )}
        </>
      )}

      {!showAdvancedCompliance && advancedFactors.length > 0 && (
        <div className="px-3 py-2 border-t border-slate-200 bg-slate-50">
          <p className="text-xs text-slate-500 italic">
            Advanced / Compliance View (Verification Friction, Influence Propagation) is available for enterprise and compliance contexts.
          </p>
        </div>
      )}
    </div>
  );
}
