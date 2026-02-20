/**
 * Sandbox Playground: effective user = impersonated_user_id ?? auth.uid().
 * When admin selects a sandbox user, session gains impersonated_user_id via cookie.
 * All downstream logic should use getEffectiveUserIdForSandbox so references, abuse, disputes run as that user.
 */

import { cookies } from "next/headers";

const SANDBOX_IMPERSONATION_COOKIE = "sandbox_playground_impersonation";

export type SandboxImpersonation = {
  userId: string;
  name: string;
  sandboxId: string | null;
  type: "employee" | "employer";
};

/**
 * Parse sandbox impersonation cookie. Returns null if not set or invalid.
 */
export async function getSandboxImpersonation(): Promise<SandboxImpersonation | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SANDBOX_IMPERSONATION_COOKIE)?.value;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { type?: string; id?: string; name?: string; sandboxId?: string | null };
    const userId = parsed.id;
    if (!userId || typeof userId !== "string") return null;
    return {
      userId,
      name: typeof parsed.name === "string" ? parsed.name : "Sandbox user",
      sandboxId: parsed.sandboxId ?? null,
      type: parsed.type === "employer" ? "employer" : "employee",
    };
  } catch {
    return null;
  }
}

/**
 * Effective user id for sandbox context: impersonated_user_id ?? authUserId.
 * Use this when performing mutations in Playground so actions run as the selected sandbox user.
 */
export async function getEffectiveUserIdForSandbox(authUserId: string): Promise<string> {
  const imp = await getSandboxImpersonation();
  return imp?.userId ?? authUserId;
}
