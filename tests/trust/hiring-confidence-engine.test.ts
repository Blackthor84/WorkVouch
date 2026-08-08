import { describe, expect, it } from "vitest";
import {
  HiringConfidenceEngine,
  ConfidenceCalculator,
  ConfidenceFactors,
  ConfidenceLevelResolver,
  ConfidenceExplainer,
  renderStarRating,
} from "@/lib/trust/confidence";
import type { ConfidenceInput } from "@/lib/trust/confidence/types";

const strongInput: ConfidenceInput = {
  trustScore: 96,
  verifiedEmploymentCount: 2,
  employmentVerified: true,
  totalVerifiedYears: 4.5,
  managerReferences: 2,
  coworkerReferences: 3,
  referenceCompletionPct: 100,
  referenceConsensus: "strong",
  averageReferenceRating: 4.7,
  timelineConfidenceAvg: 0.92,
  workflowCompletionPct: 100,
  dataFreshnessHours: 12,
  fraudFlagsCount: 0,
  hasOpenDispute: false,
  missingInformation: [],
};

describe("WorkVouch — Sprint 9A Hiring Confidence Engine", () => {
  const engine = new HiringConfidenceEngine();

  describe("ConfidenceCalculator", () => {
    it("produces 0–100 score from weighted factors", () => {
      const factors = new ConfidenceFactors().build(strongInput);
      const score = new ConfidenceCalculator().calculate(factors);
      expect(score).toBeGreaterThanOrEqual(70);
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  describe("ConfidenceLevelResolver", () => {
    it("maps score ranges to levels and stars", () => {
      const resolver = new ConfidenceLevelResolver();
      expect(resolver.resolve(96)).toEqual({
        level: "high",
        label: "High Confidence",
        starRating: 5,
      });
      expect(resolver.resolve(82).starRating).toBe(4);
      expect(resolver.resolve(67).starRating).toBe(3);
      expect(resolver.resolve(41).starRating).toBe(2);
      expect(resolver.resolve(18).starRating).toBe(1);
    });

    it("renderStarRating produces five characters", () => {
      expect(renderStarRating(4)).toBe("★★★★☆");
    });
  });

  describe("ConfidenceExplainer", () => {
    it("builds explainable contribution lines", () => {
      const result = engine.computeFromInput(strongInput);
      expect(result.confidenceExplanation.some((l) => l.includes("✓"))).toBe(true);
      expect(result.confidenceExplanation.some((l) => l.toLowerCase().includes("risk"))).toBe(true);
    });

    it("builds ascending confidence timeline", () => {
      const explainer = new ConfidenceExplainer();
      const timeline = explainer.buildTimeline(96);
      expect(timeline.length).toBe(4);
      expect(timeline[0].confidenceScore).toBeLessThan(timeline[timeline.length - 1].confidenceScore);
      expect(timeline[timeline.length - 1].confidenceScore).toBe(96);
    });
  });

  describe("HiringConfidenceEngine", () => {
    it("computes full result with factors, badges, and recommendation", () => {
      const result = engine.computeFromInput(strongInput);
      expect(result.confidenceScore).toBeGreaterThan(0);
      expect(result.confidenceFactors.length).toBe(11);
      expect(result.confidenceFactors.every((f) => f.weight > 0)).toBe(true);
      expect(result.confidenceBadges.some((b) => b.earned)).toBe(true);
      expect(result.recommendationLabel.length).toBeGreaterThan(0);
      expect(result.trustScore).toBe(96);
    });

    it("recommends manual review for low confidence", () => {
      const result = engine.computeFromInput({
        ...strongInput,
        trustScore: 15,
        employmentVerified: false,
        managerReferences: 0,
        coworkerReferences: 0,
        referenceCompletionPct: 0,
        referenceConsensus: "unknown",
        workflowCompletionPct: 20,
        hasOpenDispute: true,
        missingInformation: ["trust score", "employment verification", "references"],
      });
      expect(result.recommendation).toBe("requires_manual_review");
    });

    it("only awards earned badges", () => {
      const result = engine.computeFromInput(strongInput);
      const earned = result.confidenceBadges.filter((b) => b.earned);
      expect(earned.some((b) => b.id === "verified_employment")).toBe(true);
      expect(result.confidenceBadges.filter((b) => !b.earned).every((b) => !b.earned)).toBe(true);
    });

    it("computes from panel signals under performance budget", () => {
      const start = Date.now();
      const result = engine.computeFromPanelSignals({
        trustScore: 96,
        employmentVerified: true,
        managerReferences: 2,
        coworkerReferences: 3,
        referenceCompletionPct: 100,
        referenceConsensus: "strong",
        timelineConfidenceAvg: 0.9,
        workflowCompletionPct: 100,
        dataFreshnessHours: 1,
      });
      expect(Date.now() - start).toBeLessThan(50);
      expect(result.confidenceScore).toBeGreaterThan(0);
    });
  });
});
