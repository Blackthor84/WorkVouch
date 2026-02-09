/**
 * Sandbox identity and context for signup flow.
 * Store active sandbox identity in client state/sessionStorage when in sandbox mode.
 */

export type SandboxIdentity = {
  role: "employer" | "employee";
  industry: string;
  tier?: "starter" | "pro" | "team";
  sandboxId: string;
  /** Optional display name / company name */
  name?: string;
};

const SANDBOX_IDENTITY_KEY = "workvouch_sandbox_identity";

export function getSandboxIdentity(): SandboxIdentity | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(SANDBOX_IDENTITY_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SandboxIdentity;
  } catch {
    return null;
  }
}

export function setSandboxIdentity(identity: SandboxIdentity): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(SANDBOX_IDENTITY_KEY, JSON.stringify(identity));
  } catch {
    // ignore
  }
}

export function clearSandboxIdentity(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(SANDBOX_IDENTITY_KEY);
  } catch {
    // ignore
  }
}
