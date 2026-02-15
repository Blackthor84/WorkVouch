/**
 * Sandbox environment check. Use for fail-soft behavior and layout safety.
 * In SANDBOX: do not call admin APIs; never throw in layout code.
 */
export function isSandboxEnv() {
  return process.env.ENV === "SANDBOX";
}
