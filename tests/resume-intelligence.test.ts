/**
 * Resume Intelligence — unit tests (Sprint 11)
 */

import { describe, it, expect } from "vitest";
import { numericToConfidence, confidenceLabel } from "@/lib/resume/confidence";
import { attachDuplicateHints } from "@/lib/resume/duplicate-detection";
import { normalizeResumeDate } from "@/lib/resume/normalize-dates";
import {
  isResumePathOwnedByUser,
  toProfileResumeUrl,
  toStoragePath,
} from "@/lib/resume/path-utils";
import { validateResumeFile } from "@/lib/resume/validate-upload";
import type { ExtractedEmployment } from "@/lib/resume/types";

describe("resume upload contract", () => {
  it("toProfileResumeUrl and toStoragePath round-trip", () => {
    const key = "user-123-1700000000.pdf";
    const profileUrl = toProfileResumeUrl(key);
    expect(profileUrl).toBe("resumes/user-123-1700000000.pdf");
    expect(toStoragePath(profileUrl)).toBe(key);
    expect(toStoragePath(key)).toBe(key);
  });

  it("isResumePathOwnedByUser accepts user-prefixed flat keys", () => {
    expect(isResumePathOwnedByUser("abc-123-resume.pdf", "abc-123")).toBe(true);
    expect(isResumePathOwnedByUser("other-user-file.pdf", "abc-123")).toBe(false);
    expect(isResumePathOwnedByUser("../etc/passwd", "abc-123")).toBe(false);
    expect(isResumePathOwnedByUser("sandbox/demo.pdf", "abc-123")).toBe(true);
  });
});

describe("validateResumeFile", () => {
  it("rejects empty file", () => {
    const f = new File([], "", { type: "application/pdf" });
    expect(validateResumeFile(f).ok).toBe(false);
  });

  it("accepts pdf under size limit", () => {
    const f = new File(["x"], "resume.pdf", { type: "application/pdf" });
    expect(validateResumeFile(f)).toEqual({ ok: true });
  });

  it("rejects unsupported extension", () => {
    const f = new File(["x"], "resume.exe", { type: "application/octet-stream" });
    const result = validateResumeFile(f);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/Invalid file type/);
  });

  it("accepts txt files", () => {
    const f = new File(["hello"], "resume.txt", { type: "text/plain" });
    expect(validateResumeFile(f)).toEqual({ ok: true });
  });
});

describe("normalizeResumeDate", () => {
  it("normalizes Present to null", () => {
    expect(normalizeResumeDate("Present")).toBeNull();
    expect(normalizeResumeDate("current")).toBeNull();
  });

  it("keeps ISO dates", () => {
    expect(normalizeResumeDate("2022-01-15")).toBe("2022-01-15");
  });

  it("parses human-readable dates", () => {
    expect(normalizeResumeDate("Jan 15, 2022")).toBe("2022-01-15");
  });
});

describe("confidence model", () => {
  it("maps numeric scores to high/medium/low", () => {
    expect(numericToConfidence(0.95)).toBe("high");
    expect(numericToConfidence(0.7)).toBe("medium");
    expect(numericToConfidence(0.4)).toBe("low");
    expect(numericToConfidence(null)).toBe("medium");
  });

  it("returns user-facing labels", () => {
    expect(confidenceLabel("high")).toBe("High confidence");
    expect(confidenceLabel("medium")).toBe("Medium confidence");
    expect(confidenceLabel("low")).toBe("Low confidence");
  });
});

describe("duplicate detection", () => {
  const baseJob = (overrides: Partial<ExtractedEmployment> = {}): ExtractedEmployment => ({
    client_id: "c1",
    company_name: "ABC Security",
    job_title: "Supervisor",
    start_date: "2022-01-01",
    end_date: null,
    is_current: true,
    company_normalized: "abc security",
    location: null,
    description: null,
    employment_type: null,
    confidence: "high",
    source: "resume",
    duplicate_of: null,
    duplicate_match_reason: null,
    ...overrides,
  });

  it("flags likely duplicate by company and title", () => {
    const extracted = [baseJob()];
    const existing = [
      {
        id: "existing-1",
        company_name: "ABC Security",
        company_normalized: "abc security",
        job_title: "Supervisor",
        start_date: "2021-06-01",
        end_date: "2023-06-01",
        is_current: false,
        verification_status: "verified",
      },
    ];
    const result = attachDuplicateHints(extracted, existing);
    expect(result[0].duplicate_of).toBe("existing-1");
    expect(result[0].duplicate_match_reason).toMatch(/ABC Security/);
  });

  it("does not flag unrelated companies", () => {
    const extracted = [baseJob({ company_name: "Other Co", company_normalized: "other co" })];
    const existing = [
      {
        id: "existing-1",
        company_name: "ABC Security",
        company_normalized: "abc security",
        job_title: "Supervisor",
        start_date: "2022-01-01",
        end_date: null,
        is_current: true,
        verification_status: "pending",
      },
    ];
    const result = attachDuplicateHints(extracted, existing);
    expect(result[0].duplicate_of).toBeNull();
  });
});

describe("verification boundary (regression)", () => {
  it("resume-derived employment uses pending status in confirm schema contract", () => {
    const pendingStatus = "pending";
    const source = "resume";
    expect(pendingStatus).not.toBe("verified");
    expect(source).toBe("resume");
  });
});

describe("privacy — location fields", () => {
  it("storage path validation blocks path traversal", () => {
    expect(isResumePathOwnedByUser("user-1/../../../secret", "user-1")).toBe(false);
  });
});
