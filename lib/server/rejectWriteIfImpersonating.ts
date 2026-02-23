/**
 * Safety: block any mutation when the effective user is an impersonated user or when
 * impersonation simulation is active. Impersonation is view-only; no data must be persisted.
 */

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { getSimulationContextFromHeaders } from "@/lib/impersonation-simulation/context";
import { getEffectiveUserIdWithAuth } from "./effectiveUserId";

const IMPERSONATION_WRITE_MESSAGE = "Writes are disabled during impersonation.";

/**
 * Call at the start of any API route that mutates user data.
 * Returns a 403 if the request is impersonating (effective user or simulation active); otherwise null.
 */
export async function rejectWriteIfImpersonating(): Promise<NextResponse | null> {
  const withAuth = await getEffectiveUserIdWithAuth();
  if (withAuth?.isImpersonating) {
    return NextResponse.json({ error: IMPERSONATION_WRITE_MESSAGE }, { status: 403 });
  }
  const h = await headers();
  const simulation = getSimulationContextFromHeaders(h);
  if (simulation?.impersonating) {
    return NextResponse.json({ error: IMPERSONATION_WRITE_MESSAGE }, { status: 403 });
  }
  return null;
}
