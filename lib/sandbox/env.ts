/**
 * Sandbox environment check. Use for fail-soft behavior and layout safety.
 * In SANDBOX: do not call admin APIs; never throw in layout code.
 */
import { ENV } from "@/lib/env/env";

// Boolean env flag — NOT a function (do not call)
export const isSandboxEnv: boolean = ENV === "sandbox";
