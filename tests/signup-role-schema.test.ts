import { describe, expect, it } from "vitest";
import { resolveUserRole } from "@/lib/auth/resolveUserRole";
import { isFounderEmail } from "@/lib/auth/founder";

/**
 * Documents the production role schema contract exercised by signup + choose-role.
 * Database trigger behavior is defined in:
 * supabase/migrations/20260820180000_fix_production_signup_handle_new_user.sql
 */
describe("signup role schema contract", () => {
  const PROFILE_ROLES = ["employee", "employer", "super_admin"] as const;

  it("new signups resolve to pending when profiles.role is NULL", () => {
    expect(resolveUserRole({ role: null })).toBe("pending");
  });

  it("choose-role values map to employee and employer routing roles", () => {
    expect(resolveUserRole({ role: "employee" })).toBe("employee");
    expect(resolveUserRole({ role: "employer" })).toBe("employer");
    expect(PROFILE_ROLES).toContain("employee");
    expect(PROFILE_ROLES).toContain("employer");
  });

  it("super_admin on profiles resolves to admin zone (SuperAdmin preservation)", () => {
    expect(resolveUserRole({ role: "super_admin" })).toBe("admin");
    expect(resolveUserRole({ role: "superadmin" })).toBe("admin");
  });

  it("legacy metadata role employee must not be written at signup (maps to employee if present)", () => {
    expect(resolveUserRole({ role: "employee" })).toBe("employee");
  });

  it("legacy user alias normalizes to employee for routing", () => {
    expect(resolveUserRole({ role: "user" })).toBe("employee");
  });

  it("founder email detection matches production default", () => {
    expect(isFounderEmail("founder@tryworkvouch.com")).toBe(true);
    expect(isFounderEmail("greenhouse-test@example.com")).toBe(false);
  });

  it("invalid arbitrary role strings fall back to employee routing", () => {
    expect(resolveUserRole({ role: "not-a-real-role" })).toBe("employee");
  });
});

describe("employer access role requirements", () => {
  it("integrations require exact employer string on profiles.role", () => {
    expect(resolveUserRole({ role: "employer" })).toBe("employer");
    expect(resolveUserRole({ role: "employee" })).not.toBe("employer");
    expect(resolveUserRole({ role: null })).not.toBe("employer");
  });

  it("super_admin is not treated as employer for integrations guards", () => {
    expect(resolveUserRole({ role: "super_admin" })).toBe("admin");
  });
});
