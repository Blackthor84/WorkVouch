/**
 * ⚠️ ADMIN ROUTE
 * Must use requireAdminRoute() or getAuthedUser() for admin check
 * Do NOT use getSession() or getUserFromSession()
 */
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { requireAdminRoute } from "@/lib/auth/requireAdminRoute";
import {
  IMPERSONATION_SIMULATION_COOKIE,
  type ActorType,
  type ImpersonationSimulationContextSerialized,
} from "@/lib/impersonation-simulation/context";
import {
  EMPLOYEE_SCENARIO_KEYS,
  EMPLOYER_SCENARIO_KEYS,
} from "@/lib/impersonation-simulation/scenarioResolver";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const IMPERSONATION_SESSION_COOKIE = "impersonation_session";

/** POST — set impersonation (actorId) and/or simulation (actorType, scenario). Admin/superadmin only. Body: { actorType?, actorId?, scenario?, userId? }. */
export async function POST(req: Request) {
  try {
    await requireAdminRoute();
  } catch (res) {
    return res;
  }

  let body: { actorType?: string; actorId?: string; scenario?: string; userId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const actorId = typeof body.actorId === "string" ? body.actorId.trim() : typeof body.userId === "string" ? body.userId.trim() : null;
  const actorType = body.actorType === "employer" ? "employer" : body.actorType === "employee" ? "employee" : null;
  const scenario = typeof body.scenario === "string" ? body.scenario.trim() : null;

  const cookieStore = await cookies();

  if (actorId) {
    cookieStore.set({
      name: IMPERSONATION_SESSION_COOKIE,
      value: actorId,
      path: "/",
      httpOnly: true,
      sameSite: "lax",
    });
  }

  if (actorType && scenario) {
    const validNumeric = actorType === "employee" ? EMPLOYEE_SCENARIO_KEYS : EMPLOYER_SCENARIO_KEYS;
    const prefix = actorType === "employee" ? "employee_" : "employer_";
    const valid =
      validNumeric.includes(scenario as never) || (scenario.startsWith(prefix) && scenario.length > prefix.length);
    if (!valid) {
      return NextResponse.json({ error: "Invalid scenario for actor type" }, { status: 400 });
    }
    const payload: ImpersonationSimulationContextSerialized = {
      actorType: actorType as ActorType,
      scenario,
      impersonating: true,
      effectiveUserId: actorId ?? undefined,
      startedAt: Date.now(),
    };
    cookieStore.set({
      name: IMPERSONATION_SIMULATION_COOKIE,
      value: JSON.stringify(payload),
      path: "/",
      httpOnly: false,
      sameSite: "lax",
      maxAge: 60 * 60 * 4,
    });
  }

  return NextResponse.json({ ok: true });
}
