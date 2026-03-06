/**
 * Trust Forecasting and Industry Benchmark tests.
 * Forecast rules and percentile logic (explainable, no hardcoded scores).
 */

import { describe, it, expect } from "vitest";

describe("Trust Forecast rules", () => {
  const STABLE_THRESHOLD = 5;

  function applyForecastRules(
    hasDispute: boolean,
    recentImpact: number,
    previousImpact: number
  ): "improving" | "stable" | "at_risk" {
    if (hasDispute) return "at_risk";
    if (recentImpact > previousImpact) return "improving";
    const diff = Math.abs(recentImpact - previousImpact);
    if (diff < STABLE_THRESHOLD) return "stable";
    return "at_risk";
  }

  it("returns at_risk when unresolved dispute exists", () => {
    expect(applyForecastRules(true, 20, 5)).toBe("at_risk");
    expect(applyForecastRules(true, 0, 0)).toBe("at_risk");
  });

  it("returns improving when recentImpact > previousImpact and no dispute", () => {
    expect(applyForecastRules(false, 15, 10)).toBe("improving");
    expect(applyForecastRules(false, 1, 0)).toBe("improving");
  });

  it("returns stable when abs(recent - previous) < 5", () => {
    expect(applyForecastRules(false, 10, 8)).toBe("stable");
    expect(applyForecastRules(false, 5, 5)).toBe("stable");
    expect(applyForecastRules(false, 10, 6)).toBe("stable");
  });

  it("returns at_risk when abs(recent - previous) >= 5 and not improving", () => {
    expect(applyForecastRules(false, 5, 15)).toBe("at_risk");
    expect(applyForecastRules(false, 0, 10)).toBe("at_risk");
  });
});

describe("Forecast confidence", () => {
  const CONFIDENCE_EVENT_CAP = 10;

  function confidence(recentEventCount: number): number {
    return Math.min(1, recentEventCount / CONFIDENCE_EVENT_CAP);
  }

  it("confidence = min(1, recent_event_count / 10)", () => {
    expect(confidence(0)).toBe(0);
    expect(confidence(5)).toBe(0.5);
    expect(confidence(10)).toBe(1);
    expect(confidence(15)).toBe(1);
  });
});

describe("Industry benchmark percentile", () => {
  function percentile(countBelowOrEqual: number, total: number): number {
    if (total === 0) return 50;
    return Math.round((countBelowOrEqual / total) * 100);
  }

  it("percentile = count(score <= userScore) / total * 100", () => {
    expect(percentile(0, 10)).toBe(0);
    expect(percentile(5, 10)).toBe(50);
    expect(percentile(10, 10)).toBe(100);
    expect(percentile(0, 0)).toBe(50);
  });
});

describe("Benchmark aggregation logic", () => {
  it("avg and 90th percentile from score list", () => {
    const scores = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    expect(avg).toBe(55);
    const sorted = [...scores].sort((a, b) => a - b);
    const p90Index = Math.ceil(0.9 * sorted.length) - 1;
    const p90 = sorted[Math.max(0, p90Index)];
    expect(p90).toBe(90);
  });
});
