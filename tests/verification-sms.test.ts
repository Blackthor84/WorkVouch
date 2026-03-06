/**
 * Verification SMS support: phone normalization and delivery method.
 */

import { describe, it, expect } from "vitest";
import {
  normalizePhoneNumber,
  isValidPhoneNumber,
} from "@/lib/verification/normalizePhoneNumber";

describe("normalizePhoneNumber", () => {
  it("returns E.164 for US 10-digit", () => {
    expect(normalizePhoneNumber("6035551234")).toBe("+16035551234");
    expect(normalizePhoneNumber("(603) 555-1234")).toBe("+16035551234");
  });

  it("returns E.164 for number with leading +", () => {
    expect(normalizePhoneNumber("+16035551234")).toBe("+16035551234");
    expect(normalizePhoneNumber("+44 20 7946 0958")).toBe("+442079460958");
  });

  it("returns null for empty or invalid", () => {
    expect(normalizePhoneNumber("")).toBe(null);
    expect(normalizePhoneNumber(null)).toBe(null);
    expect(normalizePhoneNumber(undefined)).toBe(null);
    expect(normalizePhoneNumber("123")).toBe(null);
    expect(normalizePhoneNumber("abc")).toBe(null);
  });
});

describe("isValidPhoneNumber", () => {
  it("returns true for valid E.164 after normalization", () => {
    expect(isValidPhoneNumber("+16035551234")).toBe(true);
    expect(isValidPhoneNumber("6035551234")).toBe(true);
  });

  it("returns false for invalid", () => {
    expect(isValidPhoneNumber("")).toBe(false);
    expect(isValidPhoneNumber("12")).toBe(false);
  });
});
