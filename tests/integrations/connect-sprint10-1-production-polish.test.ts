import { describe, it, expect, beforeEach } from "vitest";
import { MemoryRateLimitStore } from "@/lib/rate-limit/memory-store";
import { validateConnectEnv } from "@/lib/integrations/config/connect-env";

describe("Sprint 10.1 — Rate Limit Store", () => {
  it("allows requests under limit", async () => {
    const store = new MemoryRateLimitStore();
    const r1 = await store.check({ key: "a", windowMs: 60_000, maxPerWindow: 3, prefix: "t:" });
    const r2 = await store.check({ key: "a", windowMs: 60_000, maxPerWindow: 3, prefix: "t:" });
    expect(r1.allowed).toBe(true);
    expect(r2.allowed).toBe(true);
  });

  it("blocks requests over limit", async () => {
    const store = new MemoryRateLimitStore();
    for (let i = 0; i < 3; i++) {
      await store.check({ key: "b", windowMs: 60_000, maxPerWindow: 3, prefix: "t:" });
    }
    const blocked = await store.check({ key: "b", windowMs: 60_000, maxPerWindow: 3, prefix: "t:" });
    expect(blocked.allowed).toBe(false);
  });
});

describe("Sprint 10.1 — Connect Env Validation", () => {
  const original = { ...process.env };

  beforeEach(() => {
    process.env = { ...original };
  });

  it("passes when Connect disabled in production", () => {
    process.env.NODE_ENV = "production";
    process.env.ATS_ENABLED = "false";
    const result = validateConnectEnv();
    expect(result.valid).toBe(true);
  });

  it("fails when Connect enabled but secrets missing in production", () => {
    process.env.NODE_ENV = "production";
    process.env.ATS_ENABLED = "true";
    process.env.GREENHOUSE_ENABLED = "true";
    delete process.env.ATS_ENCRYPTION_KEY;
    const result = validateConnectEnv();
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("ATS_ENCRYPTION_KEY"))).toBe(true);
  });
});
