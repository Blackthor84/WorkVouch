import { readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";
import {
  buildAuthCallbackRedirectUrl,
  buildConnectInviteReturnPath,
  isSafeConnectInviteReturnTo,
  resolvePostAuthRedirectPath,
} from "@/lib/auth/safeReturnTo";

const RAW_TOKEN = "sample-connect-invite-token";
const RETURN_PATH = buildConnectInviteReturnPath(RAW_TOKEN);

describe("buildAuthCallbackRedirectUrl", () => {
  it("embeds safe returnTo in email verification callback URL", () => {
    const url = buildAuthCallbackRedirectUrl("https://tryworkvouch.com", RETURN_PATH);
    expect(url).toBe(
      `https://tryworkvouch.com/auth/callback?returnTo=${encodeURIComponent(RETURN_PATH)}`
    );
  });

  it("returns plain callback URL when returnTo is absent", () => {
    expect(buildAuthCallbackRedirectUrl("https://tryworkvouch.com")).toBe(
      "https://tryworkvouch.com/auth/callback"
    );
  });

  it("rejects unsafe returnTo in callback URL", () => {
    expect(buildAuthCallbackRedirectUrl("https://tryworkvouch.com", "/dashboard")).toBe(
      "https://tryworkvouch.com/auth/callback"
    );
    expect(buildAuthCallbackRedirectUrl("https://tryworkvouch.com", "//evil.com/x")).toBe(
      "https://tryworkvouch.com/auth/callback"
    );
  });
});

describe("resolvePostAuthRedirectPath", () => {
  it("returns connect invite path after email verification", () => {
    expect(resolvePostAuthRedirectPath(RETURN_PATH, "/choose-role")).toBe(RETURN_PATH);
  });

  it("falls back to default path when returnTo is invalid", () => {
    expect(resolvePostAuthRedirectPath("/dashboard", "/choose-role")).toBe("/choose-role");
    expect(resolvePostAuthRedirectPath("//evil.com/connect/invite/x", "/dashboard")).toBe(
      "/dashboard"
    );
    expect(resolvePostAuthRedirectPath(null, "/dashboard")).toBe("/dashboard");
  });

  it("preserves existing default login routing when returnTo is not provided", () => {
    expect(resolvePostAuthRedirectPath(undefined, "/employer/dashboard")).toBe(
      "/employer/dashboard"
    );
  });
});

describe("isSafeConnectInviteReturnTo", () => {
  it("still rejects invalid return paths", () => {
    expect(isSafeConnectInviteReturnTo("/connect/invite/bad token")).toBe(false);
    expect(isSafeConnectInviteReturnTo("/login")).toBe(false);
  });
});

describe("signup returnTo wiring", () => {
  it("passes returnTo through signup emailRedirectTo", () => {
    const source = readFileSync(
      join(process.cwd(), "app/(public)/signup/SignupClient.tsx"),
      "utf8"
    );
    expect(source).toContain("buildAuthCallbackRedirectUrl");
    expect(source).toContain("safeReturnTo");
    expect(source).toContain("/check-email?returnTo=");
  });

  it("preserves returnTo on check-email redirect after signup without session", () => {
    const source = readFileSync(
      join(process.cwd(), "app/(public)/signup/SignupClient.tsx"),
      "utf8"
    );
    expect(source).toMatch(/check-email\?returnTo=/);
  });
});

describe("auth callback returnTo wiring", () => {
  it("reads returnTo and resolves post-auth redirect", () => {
    const source = readFileSync(join(process.cwd(), "app/auth/callback/route.ts"), "utf8");
    expect(source).toContain('searchParams.get("returnTo")');
    expect(source).toContain("resolvePostAuthRedirectPath");
  });
});

describe("existing login flow", () => {
  it("uses post-login-redirect when returnTo is absent or unsafe", () => {
    const source = readFileSync(
      join(process.cwd(), "app/(public)/login/LoginClient.tsx"),
      "utf8"
    );
    expect(source).toContain("/api/auth/post-login-redirect");
    expect(source).toContain("isSafeConnectInviteReturnTo(returnTo)");
    expect(source).toMatch(/if \(returnTo && isSafeConnectInviteReturnTo\(returnTo\)\)/);
  });
});
