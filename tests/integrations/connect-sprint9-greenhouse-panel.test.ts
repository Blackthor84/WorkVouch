import { describe, expect, it } from "vitest";
import {
  buildDemoExplainability,
  buildTrustExplainability,
} from "@/lib/integrations/greenhouse/panel/explainability";
import { buildDemoPanelPayload } from "@/lib/integrations/greenhouse/panel/demo-payload";
import { signPanelToken, verifyPanelToken } from "@/lib/integrations/greenhouse/panel/panel-auth";
import {
  mapLifecycleToWorkflowSteps,
  WORKFLOW_STEP_DEFINITIONS,
} from "@/lib/integrations/greenhouse/panel/types";

describe("WorkVouch Connect — Sprint 9 Greenhouse Embedded Panel", () => {
  describe("explainability", () => {
    it("includes weight, contribution, and confidence for each factor", () => {
      const factors = buildDemoExplainability(96);
      expect(factors.length).toBeGreaterThanOrEqual(6);
      for (const factor of factors) {
        expect(factor.weight).toBeGreaterThan(0);
        expect(factor.confidence).toBeGreaterThan(0);
        expect(factor.label.length).toBeGreaterThan(0);
      }
    });

    it("marks risk factor negative when fraud flags present", () => {
      const factors = buildTrustExplainability(60, {
        verifiedEmployments: 1,
        totalVerifiedYears: 1,
        averageReferenceRating: 3,
        referenceCount: 1,
        uniqueEmployersWithReferences: 1,
        fraudFlagsCount: 2,
      });
      const risk = factors.find((f) => f.id === "risk_signals");
      expect(risk?.status).toBe("negative");
    });
  });

  describe("workflow mapping", () => {
    it("maps lifecycle invited state to active invited step", () => {
      const steps = mapLifecycleToWorkflowSteps("invited");
      const invited = steps.find((s) => s.id === "invited");
      expect(invited?.status).toBe("active");
      expect(steps.find((s) => s.id === "imported")?.status).toBe("complete");
    });

    it("defines all required workflow steps", () => {
      expect(WORKFLOW_STEP_DEFINITIONS.map((s) => s.id)).toEqual([
        "imported",
        "invited",
        "account_created",
        "verification_started",
        "references_pending",
        "references_complete",
        "trust_updated",
        "complete",
      ]);
    });
  });

  describe("demo payload", () => {
    it("builds marketplace-ready panel with trust score and timeline", () => {
      const payload = buildDemoPanelPayload("gh-candidate-123");
      expect(payload.externalCandidateId).toBe("gh-candidate-123");
      expect(payload.trustScore).toBe(96);
      expect(payload.hiringConfidence.confidenceScore).toBeGreaterThan(0);
      expect(payload.hiringConfidence.confidenceLevelLabel).toBeTruthy();
      expect(payload.employmentTimeline.length).toBeGreaterThan(0);
      expect(payload.referenceSummary.completed).toBeGreaterThan(0);
      expect(payload.actions.canOpenFullReport).toBe(true);
    });

    it("generates panel under performance budget", () => {
      const start = Date.now();
      buildDemoPanelPayload("perf-test");
      expect(Date.now() - start).toBeLessThan(50);
    });
  });

  describe("panel auth", () => {
    it("signs and verifies panel JWT", async () => {
      process.env.PANEL_JWT_SECRET = "test-panel-secret";

      const token = await signPanelToken({
        connectionId: "conn-1",
        employerAccountId: "employer-1",
        externalCandidateId: "cand-1",
      });

      const auth = await verifyPanelToken(token);
      expect(auth?.connectionId).toBe("conn-1");
      expect(auth?.employerAccountId).toBe("employer-1");
      expect(auth?.externalCandidateId).toBe("cand-1");
    });

    it("rejects invalid panel token", async () => {
      const auth = await verifyPanelToken("invalid.token.value");
      expect(auth).toBeNull();
    });
  });

  describe("permission actions", () => {
    it("demo payload exposes authorized recruiter actions only", () => {
      const payload = buildDemoPanelPayload("auth-test");
      expect(payload.actions.canRefresh).toBe(true);
      expect(payload.actions.canOpenFullReport).toBe(true);
      expect(payload.actions.canRetrySync).toBe(false);
    });
  });
});
