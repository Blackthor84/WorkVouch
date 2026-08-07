import { describe, it, expect, vi, beforeEach } from "vitest";
import { resolveUserRole } from "@/lib/auth/resolveUserRole";
import { getRoleZoneRedirect } from "@/lib/auth/roleRouting";
import { getRoleAccessRedirect } from "@/lib/proxy/routeAccess";
import { getPostLoginRedirect } from "@/lib/auth/getPostLoginRedirect";

vi.mock("@/lib/auth/isImpersonating", () => ({
  isImpersonating: vi.fn().mockResolvedValue(false),
}));

vi.mock("@/lib/auth/employerRouting", () => ({
  getEmployerHomePath: vi.fn().mockResolvedValue("/employer/onboarding/start"),
  getEnterpriseHomePath: vi.fn().mockResolvedValue(null),
}));

import { getEmployerHomePath, getEnterpriseHomePath } from "@/lib/auth/employerRouting";
import { isImpersonating } from "@/lib/auth/isImpersonating";

describe("resolveUserRole", () => {
  it("returns pending for null or empty role", () => {
    expect(resolveUserRole({ role: null })).toBe("pending");
    expect(resolveUserRole({ role: "" })).toBe("pending");
    expect(resolveUserRole(null)).toBe("pending");
  });

  it("normalizes canonical roles", () => {
    expect(resolveUserRole({ role: "employee" })).toBe("employee");
    expect(resolveUserRole({ role: "employer" })).toBe("employer");
    expect(resolveUserRole({ role: "admin" })).toBe("admin");
  });

  it("normalizes legacy admin aliases to admin", () => {
    expect(resolveUserRole({ role: "super_admin" })).toBe("admin");
    expect(resolveUserRole({ role: "superadmin" })).toBe("admin");
  });

  it("normalizes legacy employee aliases to employee", () => {
    for (const alias of ["user", "worker", "candidate", "member"] as const) {
      expect(resolveUserRole({ role: alias })).toBe("employee");
    }
  });
});

describe("getPostLoginRedirect", () => {
  beforeEach(() => {
    vi.mocked(isImpersonating).mockResolvedValue(false);
    vi.mocked(getEmployerHomePath).mockResolvedValue("/employer/onboarding/start");
    vi.mocked(getEnterpriseHomePath).mockResolvedValue(null);
  });

  it("routes pending users to choose-role", async () => {
    await expect(getPostLoginRedirect({ id: "u1", role: null })).resolves.toBe("/choose-role");
  });

  it("routes employees to dashboard", async () => {
    await expect(getPostLoginRedirect({ id: "u1", role: "employee" })).resolves.toBe("/dashboard");
  });

  it("routes enterprise members to enterprise home", async () => {
    vi.mocked(getEnterpriseHomePath).mockResolvedValue("/enterprise/dashboard");
    await expect(getPostLoginRedirect({ id: "u1", role: "employee" })).resolves.toBe(
      "/enterprise/dashboard"
    );
  });

  it("routes employers via employer home path", async () => {
    vi.mocked(getEmployerHomePath).mockResolvedValue("/employer/dashboard");
    await expect(getPostLoginRedirect({ id: "u1", role: "employer" })).resolves.toBe(
      "/employer/dashboard"
    );
  });

  it("routes admin to admin", async () => {
    await expect(getPostLoginRedirect({ id: "u1", role: "admin" })).resolves.toBe("/admin");
  });

  it("routes impersonating admin to dashboard", async () => {
    vi.mocked(isImpersonating).mockResolvedValue(true);
    await expect(getPostLoginRedirect({ id: "u1", role: "admin" })).resolves.toBe("/dashboard");
  });
});

describe("getRoleZoneRedirect", () => {
  it("redirects /employer by role", () => {
    expect(getRoleZoneRedirect("/employer", "employer")).toBe("/employer/dashboard");
    expect(getRoleZoneRedirect("/employer", "employee")).toBe("/coworker-matches");
  });

  it("sends employers on employee paths to employer dashboard", () => {
    expect(getRoleZoneRedirect("/dashboard", "employer")).toBe("/employer/dashboard");
  });

  it("redirects legacy /dashboard/employer to canonical dashboard", () => {
    expect(getRoleZoneRedirect("/dashboard/employer", "employer")).toBe("/employer/dashboard");
    expect(getRoleZoneRedirect("/dashboard/employer/search", "employer")).toBe("/employer/dashboard");
  });

  it("sends employees away from employer portal paths", () => {
    expect(getRoleZoneRedirect("/employer/dashboard", "employee")).toBe("/dashboard");
    expect(getRoleZoneRedirect("/enterprise/foo/overview", "employee")).toBe("/dashboard");
  });
});

describe("getRoleAccessRedirect", () => {
  it("redirects /select-role to /choose-role", () => {
    expect(getRoleAccessRedirect("/select-role", true, "employee")).toBe("/choose-role");
  });

  it("sends pending users to choose-role", () => {
    expect(getRoleAccessRedirect("/dashboard", true, "pending")).toBe("/choose-role");
  });
});
