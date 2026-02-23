/**
 * Safety: simulation context is only returned when the authenticated user is admin/superadmin.
 * Use this when applying scenario overlays (injectors); never use raw getSimulationContextFromHeaders
 * for applying impersonation simulation so that non-admins cannot get simulation behavior.
 */

import { headers } from "next/headers";
import { getAuthedUser } from "@/lib/auth/getAuthedUser";
import {
  getSimulationContextFromHeaders,
  type ImpersonationSimulationContext,
} from "@/lib/impersonation-simulation/context";

/**
 * Returns simulation context from request headers only when the current session user is admin or superadmin.
 * Returns null if no context, invalid context, or caller is not an admin. Use in API routes that apply injectors.
 */
export async function getSimulationContextForAdmin(): Promise<ImpersonationSimulationContext | null> {
  const authed = await getAuthedUser();
  if (!authed || (authed.role !== "admin" && authed.role !== "superadmin")) {
    return null;
  }
  const h = await headers();
  return getSimulationContextFromHeaders(h);
}
