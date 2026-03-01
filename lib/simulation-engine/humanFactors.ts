/**
 * Human factors (intangibles) — derived from observable signals only.
 * No personality traits, character labels, culture fit, or likability.
 * All effects are explainable, event-driven, and auditable.
 */

import type { Snapshot, Review } from "./domain";

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const NOW = () => Date.now();

/** Numeric modifiers applied to engines. Traceable to signals; no moral judgment. */
export interface HumanFactorModifiers {
  /** Relational trust: increases confidence stability, reduces decay, lowers fragility. */
  confidenceStabilityMultiplier: number;
  decayReductionMultiplier: number;
  fragilityAdjustment: number;
  /** Collaboration stability: reduces downside risk, smooths fluctuations. */
  riskVolatilityReduction: number;
  /** Ethical friction: increases compliance risk, trust debt, fragility. */
  complianceRiskMultiplier: number;
  trustDebtMultiplier: number;
  /** Social gravity: multiplies downstream impact (blast radius). */
  blastRadiusMultiplier: number;
  /** Workplace friction: reduces productivity/ROI outcomes; does NOT change trust score. */
  productivityMultiplier: number;
}

/** Per-factor breakdown for Lab UI and audit. */
export interface HumanFactorFactor {
  name: string;
  explanation: string;
  signalsContributed: string[];
  effectsApplied: string[];
  proxy: number;
}

/** Audit-friendly numeric proxies and contributing event IDs. */
export interface HumanFactorAudit {
  relationalTrustProxy: number;
  collaborationStabilityProxy: number;
  ethicalFrictionProxy: number;
  socialGravityProxy: number;
  workplaceFrictionIndex: number;
  contributingReviewIds: string[];
}

export interface HumanFactorInsights {
  factors: HumanFactorFactor[];
  modifiers: HumanFactorModifiers;
  audit: HumanFactorAudit;
  /** Legacy: flat list for backward compatibility. */
  insights: string[];
}

function peerReviews(reviews: Review[]): Review[] {
  return reviews.filter((r) => r.source === "peer");
}

function supervisorReviews(reviews: Review[]): Review[] {
  return reviews.filter((r) => r.source === "supervisor");
}

function timestamps(reviews: Review[]): number[] {
  return reviews.map((r) => r.timestamp).sort((a, b) => a - b);
}

function variance(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  const sqDiffs = values.map((v) => (v - mean) ** 2);
  return sqDiffs.reduce((s, v) => s + v, 0) / values.length;
}

function relationalTrust(reviews: Review[], now: number): { proxy: number; factor: HumanFactorFactor } {
  const peers = peerReviews(reviews);
  const count = peers.length;
  const latest = peers.length ? Math.max(...peers.map((r) => r.timestamp)) : 0;
  const daysSinceLatest = latest ? (now - latest) / MS_PER_DAY : 365;
  const recencyFactor = Math.max(0, 1 - daysSinceLatest / 365);
  const proxy = Math.min(1, (count / 10) * 0.6 + recencyFactor * 0.4);

  const signals: string[] = [];
  if (count > 0) signals.push(`${count} repeat peer review(s)`);
  if (latest) signals.push(`latest peer signal ${Math.round(daysSinceLatest)} days ago`);
  if (count > 1) signals.push("cross-reviewer engagement");

  const effects: string[] = [];
  if (proxy > 0.5) {
    effects.push("increases Confidence Score stability");
    effects.push("reduces trust decay");
    effects.push("lowers fragility");
  }

  const explanation =
    count === 0
      ? "No peer re-engagement signals yet."
      : proxy > 0.6
        ? "Peers repeatedly re-engage; recent and multiple peer signals."
        : proxy > 0.3
          ? "Some repeat peer engagement; recency or volume could strengthen stability."
          : "Limited peer re-engagement observed.";

  return {
    proxy,
    factor: {
      name: "Relational Trust",
      explanation,
      signalsContributed: signals.length ? signals : ["No peer reviews yet"],
      effectsApplied: effects.length ? effects : ["No effects until peer signals present"],
      proxy: Math.round(proxy * 100) / 100,
    },
  };
}

function collaborationStability(reviews: Review[]): { proxy: number; factor: HumanFactorFactor } {
  if (reviews.length < 2) {
    return {
      proxy: 1,
      factor: {
        name: "Collaboration Stability",
        explanation: "Only one signal; stability not yet measurable.",
        signalsContributed: ["Single signal"],
        effectsApplied: ["No effects until multiple signals"],
        proxy: 1,
      },
    };
  }
  const ts = timestamps(reviews);
  const gaps = ts.slice(1).map((t, i) => t - ts[i]);
  const varGaps = variance(gaps);
  const meanGap = gaps.reduce((s, g) => s + g, 0) / gaps.length || 1;
  const normalizedVolatility = meanGap > 0 ? Math.min(1, Math.sqrt(varGaps) / meanGap) : 0;
  const proxy = Math.max(0, 1 - normalizedVolatility);

  const signals: string[] = [
    `signal volatility (gap variance)`,
    `${reviews.length} signals over time`,
  ];
  const effects: string[] = [];
  if (proxy > 0.5) {
    effects.push("reduces downside risk");
    effects.push("smooths trust fluctuations");
    effects.push("improves team-level simulation outcomes");
  }

  const explanation =
    proxy > 0.7
      ? "Low volatility under stress; signals consistent over time."
      : proxy > 0.4
        ? "Some variation in signal timing."
        : "Signal timing uneven; higher volatility.";

  return {
    proxy,
    factor: {
      name: "Collaboration Stability",
      explanation,
      signalsContributed: signals,
      effectsApplied: effects.length ? effects : ["Limited effect with current volatility"],
      proxy: Math.round(proxy * 100) / 100,
    },
  };
}

function ethicalFriction(reviews: Review[], now: number): { proxy: number; factor: HumanFactorFactor } {
  const sup = supervisorReviews(reviews);
  if (sup.length === 0) {
    return {
      proxy: 0,
      factor: {
        name: "Ethical Friction",
        explanation: "No supervisor verifications yet.",
        signalsContributed: ["No supervisor verifications"],
        effectsApplied: ["No effects until supervisor signals present"],
        proxy: 0,
      },
    };
  }
  const ts = sup.map((r) => r.timestamp).sort((a, b) => a - b);
  const earliest = ts[0];
  const latest = ts[ts.length - 1];
  const spanDays = (latest - earliest) / MS_PER_DAY;

  const proxy = Math.min(1, spanDays / 180);

  const signals: string[] = [
    `${sup.length} supervisor verification(s)`,
    `span ${Math.round(spanDays)} days`,
  ];
  if (spanDays > 60) signals.push("delayed supervisor verification");
  if (sup.length > 1 && spanDays > 30) signals.push("inconsistent supervisory signals");

  const effects: string[] = [];
  if (proxy > 0.3) {
    effects.push("increases compliance risk probability");
    effects.push("increases trust debt accumulation");
    effects.push("raises fragility under stress");
  }

  const explanation =
    spanDays > 90
      ? "Supervisor hesitation detected; long delay between verifications."
      : spanDays > 30
        ? "Moderate spread in supervisor verification timing."
        : "Supervisor verifications arrived in a tight window.";

  return {
    proxy,
    factor: {
      name: "Ethical Friction",
      explanation,
      signalsContributed: signals,
      effectsApplied: effects.length ? effects : ["Low friction with current timing"],
      proxy: Math.round(proxy * 100) / 100,
    },
  };
}

function socialGravity(reviews: Review[]): { proxy: number; factor: HumanFactorFactor } {
  const n = reviews.length;
  if (n === 0) {
    return {
      proxy: 0,
      factor: {
        name: "Social Gravity",
        explanation: "No network signals yet.",
        signalsContributed: ["No signals"],
        effectsApplied: ["No effects"],
        proxy: 0,
      },
    };
  }
  const sup = supervisorReviews(reviews);
  const supervisorWeightSum = sup.reduce((s, r) => s + r.weight, 0);
  const totalWeight = reviews.reduce((s, r) => s + r.weight, 0);
  const seniorityShare = totalWeight > 0 ? supervisorWeightSum / totalWeight : 0;
  const proxy = Math.min(1, (n / 20) * 0.5 + seniorityShare * 0.5);

  const signals: string[] = [`network strength: ${n} signal(s)`, "reviewer seniority weighting"];
  if (sup.length > 0) signals.push("supervisor-derived weight");

  const effects: string[] = [];
  if (proxy > 0.3) {
    effects.push("multiplies downstream impact of trust changes");
    effects.push("increases blast radius (positive or negative)");
  }

  const explanation =
    proxy > 0.5
      ? "Network amplifies downstream impact; strong seniority-weighted endorsement."
      : proxy > 0.2
        ? "Some network effect; seniority weight present."
        : "Limited network or seniority signals.";

  return {
    proxy,
    factor: {
      name: "Social Gravity",
      explanation,
      signalsContributed: signals,
      effectsApplied: effects.length ? effects : ["Minimal blast radius with current network"],
      proxy: Math.round(proxy * 100) / 100,
    },
  };
}

function workplaceFrictionIndex(reviews: Review[], now: number): { proxy: number; factor: HumanFactorFactor } {
  if (reviews.length < 2) {
    return {
      proxy: 0,
      factor: {
        name: "Workplace Friction Index",
        explanation: "Not enough signals to estimate friction.",
        signalsContributed: ["Insufficient signals"],
        effectsApplied: ["No effects"],
        proxy: 0,
      },
    };
  }
  const ts = timestamps(reviews);
  const span = (ts[ts.length - 1] - ts[0]) / MS_PER_DAY;
  const oldestAgeDays = (now - ts[0]) / MS_PER_DAY;
  const volatilityComponent = Math.min(1, span / 365);
  const decayComponent = Math.min(1, oldestAgeDays / 730);
  const proxy = Math.min(1, volatilityComponent * 0.5 + decayComponent * 0.5);

  const signals: string[] = [
    "signal disagreement (spread)",
    "signal age and decay",
  ];
  if (proxy > 0.5) signals.push("post-hire trust decay (stale signals)");

  const effects: string[] = [];
  if (proxy > 0.3) {
    effects.push("reduces productivity outcomes");
    effects.push("impacts ROI and culture calculations");
    effects.push("does NOT directly change trust score");
  }

  const explanation =
    proxy > 0.6
      ? "Higher coordination cost; signal history spread and older."
      : proxy > 0.3
        ? "Some spread and age in signal history."
        : "Signals recent and clustered; low friction.";

  return {
    proxy,
    factor: {
      name: "Workplace Friction Index",
      explanation,
      signalsContributed: signals,
      effectsApplied: effects.length ? effects : ["Low friction with current signals"],
      proxy: Math.round(proxy * 100) / 100,
    },
  };
}

/**
 * Compute human factor insights and modifiers from snapshot (reviews only).
 * Event-driven; no personality or moral judgment. All effects auditable.
 */
export function computeHumanFactorInsights(snapshot: Snapshot, now: number = NOW()): HumanFactorInsights {
  const reviews = snapshot.reviews;
  const contributingReviewIds = reviews.map((r) => r.id);

  const rt = relationalTrust(reviews, now);
  const cs = collaborationStability(reviews);
  const ef = ethicalFriction(reviews, now);
  const sg = socialGravity(reviews);
  const wf = workplaceFrictionIndex(reviews, now);

  const factors = [rt.factor, cs.factor, ef.factor, sg.factor, wf.factor];

  const modifiers: HumanFactorModifiers = {
    confidenceStabilityMultiplier: 0.85 + rt.proxy * 0.3,
    decayReductionMultiplier: 0.9 + rt.proxy * 0.2,
    fragilityAdjustment: (ef.proxy * 15) - (rt.proxy * 10) - (cs.proxy * 5),
    riskVolatilityReduction: cs.proxy * 0.2,
    complianceRiskMultiplier: 0.9 + ef.proxy * 0.3,
    trustDebtMultiplier: 0.9 + ef.proxy * 0.4,
    blastRadiusMultiplier: 0.8 + sg.proxy * 0.4,
    productivityMultiplier: 1 - wf.proxy * 0.25,
  };

  return {
    factors,
    modifiers,
    audit: {
      relationalTrustProxy: rt.factor.proxy,
      collaborationStabilityProxy: cs.factor.proxy,
      ethicalFrictionProxy: ef.factor.proxy,
      socialGravityProxy: sg.factor.proxy,
      workplaceFrictionIndex: wf.factor.proxy,
      contributingReviewIds,
    },
    insights: factors.map((f) => f.explanation),
  };
}
