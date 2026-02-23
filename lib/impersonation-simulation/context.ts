/**
 * Impersonation simulation context (admin-only).
 * Stored in session/cookie; never persisted to DB. Used for scenario-based demos and abuse testing.
 */

export type ActorType = "employee" | "employer";

export type ImpersonationSimulationContext = {
  /** Which role is being simulated */
  actorType: ActorType;
  /** Scenario pack id (e.g. employee_01, employer_07) */
  scenario: string;
  /** True when admin is actively viewing as the simulated actor */
  impersonating: boolean;
  /** Effective user id when impersonating (resolved server-side) */
  effectiveUserId?: string | null;
  /** Admin user id (audit) */
  adminUserId?: string | null;
  /** Epoch ms when context was started */
  startedAt?: number | null;
};

export type ImpersonationSimulationContextSerialized = {
  actorType: ActorType;
  scenario: string;
  impersonating: boolean;
  effectiveUserId?: string | null;
  adminUserId?: string | null;
  startedAt?: number | null;
};

/** Cookie name for simulation context (JWT or JSON). Admin-only; never sent to real users. */
export const IMPERSONATION_SIMULATION_COOKIE = "wv_impersonation_simulation";

/** Request header keys set by middleware for server-side resolution */
export const IMPERSONATION_HEADERS = {
  ACTOR_TYPE: "x-impersonation-actor-type",
  SCENARIO: "x-impersonation-scenario",
  IMPERSONATING: "x-impersonation-impersonating",
  EFFECTIVE_USER_ID: "x-impersonation-effective-user-id",
} as const;

export function parseSimulationContextFromCookie(
  raw: string | undefined
): ImpersonationSimulationContext | null {
  if (!raw || typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    const parsed = JSON.parse(trimmed) as ImpersonationSimulationContextSerialized;
    if (
      (parsed.actorType !== "employee" && parsed.actorType !== "employer") ||
      typeof parsed.scenario !== "string" ||
      typeof parsed.impersonating !== "boolean"
    ) {
      return null;
    }
    return {
      actorType: parsed.actorType,
      scenario: parsed.scenario,
      impersonating: parsed.impersonating,
      effectiveUserId: parsed.effectiveUserId ?? null,
      adminUserId: parsed.adminUserId ?? null,
      startedAt: parsed.startedAt ?? null,
    };
  } catch {
    return null;
  }
}

/**
 * Read simulation context from request headers (set by middleware).
 * For applying scenario overlays (injectors), use getSimulationContextForAdmin() from
 * @/lib/server/simulationContextForAdmin so that simulation only runs for admins.
 */
export function getSimulationContextFromHeaders(headers: Headers): ImpersonationSimulationContext | null {
  const actorType = headers.get(IMPERSONATION_HEADERS.ACTOR_TYPE);
  const scenario = headers.get(IMPERSONATION_HEADERS.SCENARIO);
  const impersonating = headers.get(IMPERSONATION_HEADERS.IMPERSONATING);
  const effectiveUserId = headers.get(IMPERSONATION_HEADERS.EFFECTIVE_USER_ID);

  if (
    (actorType !== "employee" && actorType !== "employer") ||
    !scenario ||
    impersonating === null
  ) {
    return null;
  }

  return {
    actorType,
    scenario,
    impersonating: impersonating === "true",
    effectiveUserId: effectiveUserId ?? null,
    adminUserId: null,
    startedAt: null,
  };
}
