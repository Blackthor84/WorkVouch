import { describe, it, expect } from "vitest";
import {
  buildContactField,
  displayNameFromContactValue,
  isValidEmail,
  parseContactField,
} from "@/lib/invites/coworkerVouchContact";
import { inviteWasSent } from "@/lib/invites/coworkerVouchInviteStore";

describe("coworkerVouchContact", () => {
  it("parses email contact", () => {
    expect(parseContactField("alex@example.com")).toEqual({
      email: "alex@example.com",
      phone: null,
    });
  });

  it("builds email contact field", () => {
    expect(buildContactField("alex@example.com", null)).toBe("alex@example.com");
  });

  it("derives display name from email", () => {
    expect(displayNameFromContactValue("alex@example.com")).toBe("alex");
  });

  it("validates email", () => {
    expect(isValidEmail("alex@example.com")).toBe(true);
    expect(isValidEmail("bad")).toBe(false);
  });
});

describe("inviteWasSent", () => {
  it("returns true for opened, accepted, declined", () => {
    expect(inviteWasSent("opened")).toBe(true);
    expect(inviteWasSent("accepted")).toBe(true);
    expect(inviteWasSent("declined")).toBe(true);
  });

  it("returns false for pending (and legacy sent/draft values)", () => {
    expect(inviteWasSent("pending")).toBe(false);
    expect(inviteWasSent("sent")).toBe(false);
    expect(inviteWasSent("draft")).toBe(false);
  });
});
