import { describe, expect, it } from "vitest";
import { enterpriseOrgTablesAvailable } from "@/lib/employer/enterpriseOrgTables";

describe("enterpriseOrgTablesAvailable", () => {
  it("returns false when organizations table is absent (PGRST205)", async () => {
    const client = {
      from: () => ({
        select: () => ({
          limit: async () => ({ error: { code: "PGRST205" } }),
        }),
      }),
    };
    await expect(enterpriseOrgTablesAvailable(client)).resolves.toBe(false);
  });

  it("returns true when organizations table is reachable", async () => {
    const client = {
      from: () => ({
        select: () => ({
          limit: async () => ({ error: null }),
        }),
      }),
    };
    await expect(enterpriseOrgTablesAvailable(client)).resolves.toBe(true);
  });
});
