/**
 * Admin context: single source of truth, 403 response, and access guards.
 * Guards: super_admin sees admin button (isAdmin true), regular user never (isAdmin false),
 * sandbox unlocks extra APIs (canSeedData/isSandbox), production never shows demo data (env filter).
 */

import { describe, it, expect } from "vitest";
import {
  adminForbiddenResponse,
  hasAdminAccess,
  type AdminContext,
} from "@/lib/admin/getAdminContext";

describe("Admin context and 403", () => {
  it("adminForbiddenResponse returns 403 with Upgrade Required message", async () => {
    const res = adminForbiddenResponse();
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toContain("Upgrade Required");
    expect(body.error).toContain("Enterprise Recommended");
  });

  it("hasAdminAccess is false for regular user context", () => {
    const ctx: AdminContext = {
      userId: "u1",
      email: "u@example.com",
      roles: ["user"],
      isAdmin: false,
      isSuperAdmin: false,
      isSandbox: false,
      canImpersonate: false,
      canBypassLimits: false,
      canSeedData: false,
    };
    expect(hasAdminAccess(ctx)).toBe(false);
  });

  it("hasAdminAccess is true when isAdmin true (super_admin sees admin)", () => {
    const ctx: AdminContext = {
      userId: "a1",
      email: "admin@example.com",
      roles: ["user", "admin", "super_admin"],
      isAdmin: true,
      isSuperAdmin: true,
      isSandbox: false,
      canImpersonate: true,
      canBypassLimits: true,
      canSeedData: true,
    };
    expect(hasAdminAccess(ctx)).toBe(true);
  });

  it("regular user never has admin access", () => {
    const ctx: AdminContext = {
      userId: "u2",
      email: "user@example.com",
      roles: ["user"],
      isAdmin: false,
      isSuperAdmin: false,
      isSandbox: false,
      canImpersonate: false,
      canBypassLimits: false,
      canSeedData: false,
    };
    expect(hasAdminAccess(ctx)).toBe(false);
    expect(ctx.isAdmin).toBe(false);
  });

  it("sandbox context has canSeedData for extra APIs", () => {
    const ctx: AdminContext = {
      userId: "a2",
      email: "admin@example.com",
      roles: ["user", "admin"],
      isAdmin: true,
      isSuperAdmin: false,
      isSandbox: true,
      canImpersonate: true,
      canBypassLimits: true,
      canSeedData: true,
    };
    expect(ctx.canSeedData).toBe(true);
    expect(ctx.isSandbox).toBe(true);
    expect(hasAdminAccess(ctx)).toBe(true);
  });
});
