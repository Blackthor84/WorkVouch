import { readFileSync } from "fs";
import { join } from "path";
import { describe, it, expect } from "vitest";
import {
  isHiringOutcomeFeedbackTableMissingError,
  resolveHiringOutcomeStatusFromQuery,
  PGRST_TABLE_MISSING,
} from "@/lib/employer/hiringOutcomeFeedback";

describe("hiring outcome feedback (production schema)", () => {
  it("detects PGRST205 missing table error", () => {
    expect(
      isHiringOutcomeFeedbackTableMissingError({
        code: PGRST_TABLE_MISSING,
        message: "Could not find the table 'public.hiring_outcome_feedback' in the schema cache",
      })
    ).toBe(true);
  });

  it("returns safe unavailable status when hiring_outcome_feedback is missing", () => {
    expect(
      resolveHiringOutcomeStatusFromQuery(null, {
        code: PGRST_TABLE_MISSING,
        message: "Could not find the table 'public.hiring_outcome_feedback' in the schema cache",
      })
    ).toEqual({ available: false, showPrompt: false });
  });

  it("shows prompt when table exists and no feedback row", () => {
    expect(resolveHiringOutcomeStatusFromQuery(null, null)).toEqual({
      available: true,
      showPrompt: true,
    });
  });

  it("hides prompt when feedback row exists", () => {
    expect(resolveHiringOutcomeStatusFromQuery({ id: "row-1" }, null)).toEqual({
      available: true,
      showPrompt: false,
    });
  });

  it("throws on non-missing-table query errors", () => {
    expect(() =>
      resolveHiringOutcomeStatusFromQuery(null, { message: "permission denied" })
    ).toThrow("permission denied");
  });

  it("hiring-outcome-status route uses production-safe resolver", () => {
    const source = readFileSync(
      join(
        process.cwd(),
        "app/api/employer/candidate/[id]/hiring-outcome-status/route.ts"
      ),
      "utf8"
    );
    expect(source).toContain("resolveHiringOutcomeStatusFromQuery");
    expect(source).not.toMatch(/if \(error\)[\s\S]*status: 500/);
  });
});
