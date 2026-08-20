import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  isConnectDemoAllowed,
  isConnectProduction,
  requireConnectEnabled,
  requireCronSecret,
  validateConnectProductionSecrets,
} from "@/lib/integrations/connect/connect-route-guards";

describe("WorkVouch Connect — Sprint 10 Route Guards", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe("isConnectDemoAllowed", () => {
    it("allows demo in non-production", () => {
      process.env.NODE_ENV = "development";
      delete process.env.CONNECT_DEMO_MODE_ENABLED;
      expect(isConnectDemoAllowed()).toBe(true);
    });

    it("blocks demo in production unless flag set", () => {
      process.env.NODE_ENV = "production";
      delete process.env.CONNECT_DEMO_MODE_ENABLED;
      expect(isConnectDemoAllowed()).toBe(false);
    });

    it("allows demo in production when CONNECT_DEMO_MODE_ENABLED=true", () => {
      process.env.NODE_ENV = "production";
      process.env.CONNECT_DEMO_MODE_ENABLED = "true";
      expect(isConnectDemoAllowed()).toBe(true);
    });
  });

  describe("requireConnectEnabled", () => {
    it("returns 503 when ATS_ENABLED is off", () => {
      process.env.ATS_ENABLED = "false";
      process.env.GREENHOUSE_ENABLED = "true";
      const res = requireConnectEnabled();
      expect(res?.status).toBe(503);
    });
  });

  describe("requireCronSecret", () => {
    it("returns 401 without bearer token", () => {
      process.env.CRON_SECRET = "test-cron-secret";
      const req = new Request("http://localhost/api/integrations/v1/import");
      const res = requireCronSecret(req);
      expect(res?.status).toBe(401);
    });

    it("returns null with valid bearer token", () => {
      process.env.CRON_SECRET = "test-cron-secret";
      const req = new Request("http://localhost/api/integrations/v1/import", {
        headers: { authorization: "Bearer test-cron-secret" },
      });
      expect(requireCronSecret(req)).toBeNull();
    });
  });

  describe("validateConnectProductionSecrets", () => {
    it("returns empty in development", () => {
      process.env.NODE_ENV = "development";
      expect(validateConnectProductionSecrets()).toEqual([]);
    });

    it("lists missing secrets in production", () => {
      process.env.NODE_ENV = "production";
      delete process.env.ATS_ENCRYPTION_KEY;
      delete process.env.PANEL_JWT_SECRET;
      const missing = validateConnectProductionSecrets();
      expect(missing).toContain("ATS_ENCRYPTION_KEY");
      expect(missing).toContain("PANEL_JWT_SECRET");
    });
  });

  describe("isConnectProduction", () => {
    it("detects production node env", () => {
      process.env.NODE_ENV = "production";
      expect(isConnectProduction()).toBe(true);
    });
  });
});
