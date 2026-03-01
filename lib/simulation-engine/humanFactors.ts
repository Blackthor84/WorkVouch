/**
 * Human factors — derived from observable signals only.
 * No personality or character labels. Used for interpretive insights and optional
 * weight/decay modulation. All effects are auditable and event-driven.
 */

import type { Snapshot, Review } from "./domain";

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const NOW = () => Date.now();

/** Audit-friendly numeric proxies (for event logs). Not displayed as standalone scores. */
export interface HumanFactorAudit {
  relationalTrustProxy: number;
  collaborationStabilityProxy: number;
  ethicalFrictionProxy: number;
  socialGravityProxy: number;
  workplaceFrictionIndex: number;
}

/** Plain-language interpretive insights only. No moral judgment. */
export interface HumanFactorInsights {
  insights: string[];
  audit: HumanFactorAudit;
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

/**
 * Relational trust: observable repeat peer engagement (count and recency of peer signals).
 * Proxy: normalized 0–1 from peer count and how recent the latest peer signal is.
 */
function relationalTrust(reviews: Review[], now: number): { proxy: number; insight: string } {
  const peers = peerReviews(reviews);
  const count = peers.length;
  const latest = peers.length ? Math.max(...peers.map((r) => r.timestamp)) : 0;
  const daysSinceLatest = latest ? (now - latest) / MS_PER_DAY : 365;
  const recencyFactor = Math.max(0, 1 - daysSinceLatest / 365);
  const proxy = Math.min(1, (count / 10) * 0.6 + recencyFactor * 0.4);
  if (count === 0) return { proxy: 0, insight: "No peer engagement signals yet; add peer reviews to improve observable relational signals." };
  const recencyNote = daysSinceLatest < 90 ? "Recent peer engagement." : daysSinceLatest < 180 ? "Peer engagement is somewhat dated." : "Peer engagement is older; newer signals would strengthen the picture.";
  return { proxy, insight: `${count} peer signal(s). ${recencyNote}` };
}

/**
 * Collaboration stability: signal consistency over time (low variance in timing and weight).
 * Proxy: inverse of normalized variance of review timestamps (0 = high stability).
 */
function collaborationStability(reviews: Review[]): { proxy: number; insight: string } {
  if (reviews.length < 2) {
    return { proxy: 1, insight: "Only one signal; stability is not yet measurable." };
  }
  const ts = timestamps(reviews);
  const gaps = ts.slice(1).map((t, i) => t - ts[i]);
  const varGaps = variance(gaps);
  const meanGap = gaps.reduce((s, g) => s + g, 0) / gaps.length || 1;
  const normalizedVolatility = meanGap > 0 ? Math.min(1, Math.sqrt(varGaps) / meanGap) : 0;
  const stabilityProxy = Math.max(0, 1 - normalizedVolatility);
  const insight = stabilityProxy > 0.7
    ? "Signals are spread consistently over time."
    : stabilityProxy > 0.4
      ? "Some variation in when signals arrived; more consistent timing would increase stability."
      : "Signal timing is uneven; consider whether gaps reflect normal workflow or delays.";
  return { proxy: stabilityProxy, insight };
}

/**
 * Ethical friction: observable hesitation or delay in supervisor verification.
 * Proxy: delay between earliest and latest supervisor review (or time to first supervisor review).
 * No moral judgment — only "delay" as an observable.
 */
function ethicalFriction(reviews: Review[], now: number): { proxy: number; insight: string } {
  const sup = supervisorReviews(reviews);
  if (sup.length === 0) return { proxy: 0, insight: "No supervisor verifications yet; add verifications to observe timing." };
  const ts = sup.map((r) => r.timestamp).sort((a, b) => a - b);
  const earliest = ts[0];
  const latest = ts[ts.length - 1];
  const spanDays = (latest - earliest) / MS_PER_DAY;
  const delayToFirst = (earliest - (now - 365 * MS_PER_DAY)) / MS_PER_DAY;
  const proxy = Math.min(1, (spanDays / 180) * 0.5 + Math.max(0, delayToFirst / 180) * 0.5);
  if (spanDays > 90) return { proxy: Math.min(1, proxy), insight: "Supervisor verifications span a long period; consider whether this reflects normal process or back-and-forth." };
  if (spanDays > 30) return { proxy, insight: "Moderate spread between first and last supervisor verification." };
  return { proxy, insight: "Supervisor verifications arrived in a tight window." };
}

/**
 * Social gravity: network strength × reviewer seniority (supervisor weight vs peer).
 * Proxy: (network size) * (weighted share of supervisor-derived signals).
 */
function socialGravity(reviews: Review[]): { proxy: number; insight: string } {
  const n = reviews.length;
  if (n === 0) return { proxy: 0, insight: "No network signals yet." };
  const sup = supervisorReviews(reviews);
  const supervisorWeightSum = sup.reduce((s, r) => s + r.weight, 0);
  const totalWeight = reviews.reduce((s, r) => s + r.weight, 0);
  const seniorityShare = totalWeight > 0 ? supervisorWeightSum / totalWeight : 0;
  const proxy = Math.min(1, (n / 20) * 0.5 + seniorityShare * 0.5);
  if (sup.length === 0) return { proxy: Math.min(1, n / 20), insight: "Network strength comes from peer and other signals only; no supervisor-derived weight yet." };
  return { proxy, insight: `Network has ${n} signal(s) with a strong supervisor-weighted component.` };
}

/**
 * Workplace friction index: derived from volatility (timestamp spread) and decay (age of oldest).
 * Proxy: higher when reviews are spread out and older (more friction).
 */
function workplaceFrictionIndex(reviews: Review[], now: number): { proxy: number; insight: string } {
  if (reviews.length < 2) return { proxy: 0, insight: "Not enough signals to estimate friction." };
  const ts = timestamps(reviews);
  const span = (ts[ts.length - 1] - ts[0]) / MS_PER_DAY;
  const oldestAgeDays = (now - ts[0]) / MS_PER_DAY;
  const volatilityComponent = Math.min(1, span / 365);
  const decayComponent = Math.min(1, oldestAgeDays / 730);
  const proxy = Math.min(1, volatilityComponent * 0.5 + decayComponent * 0.5);
  const insight = proxy > 0.6
    ? "Signal history is spread and older; consider refreshing with recent verifications."
    : proxy > 0.3
      ? "Some spread and age in the signal history."
      : "Signals are relatively recent and clustered.";
  return { proxy, insight };
}

/**
 * Compute human factor insights from snapshot (reviews only). Event-driven; no personality labels.
 */
export function computeHumanFactorInsights(snapshot: Snapshot, now: number = NOW()): HumanFactorInsights {
  const reviews = snapshot.reviews;
  const rt = relationalTrust(reviews, now);
  const cs = collaborationStability(reviews);
  const ef = ethicalFriction(reviews, now);
  const sg = socialGravity(reviews);
  const wf = workplaceFrictionIndex(reviews, now);

  const insights: string[] = [];
  if (reviews.length === 0) {
    insights.push("No observable signals yet. Add verifications and reviews to see human-factor insights.");
  } else {
    insights.push(rt.insight);
    insights.push(cs.insight);
    insights.push(ef.insight);
    insights.push(sg.insight);
    insights.push(wf.insight);
  }

  return {
    insights,
    audit: {
      relationalTrustProxy: Math.round(rt.proxy * 100) / 100,
      collaborationStabilityProxy: Math.round(cs.proxy * 100) / 100,
      ethicalFrictionProxy: Math.round(ef.proxy * 100) / 100,
      socialGravityProxy: Math.round(sg.proxy * 100) / 100,
      workplaceFrictionIndex: Math.round(wf.proxy * 100) / 100,
    },
  };
}
