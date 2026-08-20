import { describe, expect, it } from "vitest";

const SANDBOX_ENABLED = process.env.GREENHOUSE_SANDBOX_SMOKE === "true";
const hasCredentials =
  Boolean(process.env.GREENHOUSE_CLIENT_ID?.trim()) &&
  Boolean(process.env.GREENHOUSE_CLIENT_SECRET?.trim());

describe.skipIf(!SANDBOX_ENABLED || !hasCredentials)(
  "Greenhouse sandbox smoke (requires GREENHOUSE_SANDBOX_SMOKE=true)",
  () => {
    it("placeholder — run manual sandbox checklist in docs/providers/greenhouse/sandbox-testing.md", () => {
      expect(hasCredentials).toBe(true);
    });
  }
);

describe("Greenhouse sandbox smoke gate", () => {
  it("documents that live sandbox tests are opt-in", () => {
    if (SANDBOX_ENABLED && hasCredentials) {
      expect(true).toBe(true);
      return;
    }
    expect(SANDBOX_ENABLED).toBe(false);
  });
});
