/**
 * ⚠️ ADMIN ROUTE
 * Must use requireAdminRoute()
 * Do NOT use getSession() or getUserFromSession()
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { requireAdminRoute } from "@/lib/auth/requireAdminRoute";
import {
  IMPERSONATION_SIMULATION_COOKIE,
  type ImpersonationSimulationContextSerialized,
} from "@/lib/impersonation-simulation/context";
import {
  EMPLOYEE_SCENARIO_KEYS,
  EMPLOYER_SCENARIO_KEYS,
} from "@/lib/impersonation-simulation/scenarioResolver";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdminRoute();
  } catch (res) {
    return res;
  }
  return NextResponse.json({ ok: true });
}

export async function POST(req: NextRequest) {
  const result = await requireAdminRoute();
  if ("error" in result) return result.error;

  let body: { actorType?: string; scenario?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const actorType = body.actorType === "employer" ? "employer" : "employee";
  const scenario = typeof body.scenario === "string" ? body.scenario.trim() : undefined;

  const validScenarios =
    actorType === "employee" ? EMPLOYEE_SCENARIO_KEYS : EMPLOYER_SCENARIO_KEYS;

  if (!scenario || !validScenarios.includes(scenario as never)) {
    return NextResponse.json({ error: "Invalid scenario" }, { status: 400 });
  }

  const payload: ImpersonationSimulationContextSerialized = {
    actorType,
    scenario,
    impersonating: true,
    startedAt: Date.now(),
  };

  const cookieStore = await cookies();
  cookieStore.set({
    name: IMPERSONATION_SIMULATION_COOKIE,
    value: JSON.stringify(payload),
    path: "/",
    sameSite: "lax",
    httpOnly: false,
    maxAge: 60 * 60 * 4,
  });

  return NextResponse.json({ ok: true, context: payload });
}

export async function DELETE() {
  try {
    await requireAdminRoute();
  } catch (res) {
    return res;
  }

  const cookieStore = await cookies();
  cookieStore.delete({ name: IMPERSONATION_SIMULATION_COOKIE, path: "/" });
  return NextResponse.json({ ok: true });
}
