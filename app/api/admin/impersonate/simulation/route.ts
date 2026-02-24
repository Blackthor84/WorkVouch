import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseServer } from "@/lib/supabase/server";
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

/** Role from user_metadata (or app_metadata fallback). Used for POST/DELETE admin check. */
async function getAuthUserAndRole(): Promise<{ user: { id: string }; role: string | null } | null> {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const role =
    (user as { user_metadata?: { role?: string }; app_metadata?: { role?: string } }).user_metadata
      ?.role ??
    (user as { app_metadata?: { role?: string } }).app_metadata?.role ??
    null;
  return { user: { id: user.id }, role: role?.toLowerCase() ?? null };
}

function requireAdminOrSuperAdmin(role: string | null) {
  if (role === null) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  if (role !== "admin" && role !== "superadmin") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }
  return null;
}

/** GET — auth check (superadmin only). Supabase auth + role from user_metadata. */
export async function GET() {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // IMPORTANT: role must come from DB or metadata (user_metadata or app_metadata)
  const role =
    (user as { user_metadata?: { role?: string } }).user_metadata?.role ??
    (user as { app_metadata?: { role?: string } }).app_metadata?.role;

  if (role !== "superadmin") {
    return NextResponse.json(
      { error: "Admin access required" },
      { status: 403 }
    );
  }

  return NextResponse.json({ ok: true, simulation: true });
}

/** POST — set simulation context (admin-only). Body: { actorType, scenario, impersonating? } */
export async function POST(req: NextRequest) {
  const auth = await getAuthUserAndRole();
  const authError = requireAdminOrSuperAdmin(auth?.role ?? null);
  if (authError) return authError;
  const cookieStore = await cookies();
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
  const auth = await getAuthUserAndRole();
  const authError = requireAdminOrSuperAdmin(auth?.role ?? null);
  if (authError) return authError;
  const cookieStore = await cookies();
  cookieStore.delete({ name: IMPERSONATION_SIMULATION_COOKIE, path: "/" });
  return NextResponse.json({ ok: true });
}
