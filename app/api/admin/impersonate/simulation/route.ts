import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { hasRole } from "@/lib/auth";
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

/** GET — return current simulation context from cookie (admin-only). */
export async function GET() {
  if (!(await hasRole("admin")) && !(await hasRole("superadmin"))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const cookieStore = await cookies();
  const raw = cookieStore.get(IMPERSONATION_SIMULATION_COOKIE)?.value;
  if (!raw) {
    return NextResponse.json({ context: null });
  }
  try {
    const context = JSON.parse(raw) as ImpersonationSimulationContextSerialized;
    return NextResponse.json({ context });
  } catch {
    return NextResponse.json({ context: null });
  }
}

/** POST — set simulation context (admin-only). Body: { actorType, scenario, impersonating? } */
export async function POST(req: NextRequest) {
  if (!(await hasRole("admin")) && !(await hasRole("superadmin"))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  let body: { actorType?: string; scenario?: string; impersonating?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const actorType = body.actorType === "employer" ? "employer" : body.actorType === "employee" ? "employee" : null;
  const scenario = typeof body.scenario === "string" ? body.scenario.trim() : null;
  const impersonating = typeof body.impersonating === "boolean" ? body.impersonating : true;

  if (!actorType || !scenario) {
    return NextResponse.json({ error: "actorType and scenario required" }, { status: 400 });
  }

  const validKeys = actorType === "employee" ? EMPLOYEE_SCENARIO_KEYS : EMPLOYER_SCENARIO_KEYS;
  if (!validKeys.includes(scenario as never)) {
    return NextResponse.json({ error: "Invalid scenario for actor type" }, { status: 400 });
  }

  const payload: ImpersonationSimulationContextSerialized = {
    actorType,
    scenario,
    impersonating,
    startedAt: Date.now(),
  };

  const cookieStore = await cookies();
  cookieStore.set({
    name: IMPERSONATION_SIMULATION_COOKIE,
    value: JSON.stringify(payload),
    path: "/",
    httpOnly: false,
    sameSite: "lax",
    maxAge: 60 * 60 * 4, // 4 hours
  });

  return NextResponse.json({ ok: true, context: payload });
}

/** DELETE — clear simulation context (admin-only). */
export async function DELETE() {
  if (!(await hasRole("admin")) && !(await hasRole("superadmin"))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const cookieStore = await cookies();
  cookieStore.delete({ name: IMPERSONATION_SIMULATION_COOKIE, path: "/" });
  return NextResponse.json({ ok: true });
}
