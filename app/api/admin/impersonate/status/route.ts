import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getAuthedUser } from "@/lib/auth/getAuthedUser";
import {
  IMPERSONATION_SIMULATION_COOKIE,
  parseSimulationContextFromCookie,
} from "@/lib/impersonation-simulation/context";

export const runtime = "nodejs";

type ImpersonationSession = {
  adminId: string;
  impersonatedUserId: string;
  startedAt: number;
};

/** GET /api/admin/impersonate/status — returns active session + simulation context. Admin-only (real session user). */
export async function GET() {
  const authed = await getAuthedUser();
  if (!authed || (authed.role !== "admin" && authed.role !== "superadmin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const cookieStore = await cookies();
  const raw = cookieStore.get("impersonation_session")?.value?.trim();
  const simRaw = cookieStore.get(IMPERSONATION_SIMULATION_COOKIE)?.value;
  const simulation = parseSimulationContextFromCookie(simRaw);

  const impersonation =
    simulation != null
      ? {
          impersonating: simulation.impersonating,
          actorType: simulation.actorType,
          scenario: simulation.scenario ?? undefined,
        }
      : undefined;

  if (!raw) {
    return NextResponse.json({
      active: false,
      impersonating: false,
      ...(impersonation != null && { impersonation }),
    });
  }

  try {
    const session = JSON.parse(raw) as ImpersonationSession;
    return NextResponse.json({
      active: true,
      impersonating: true,
      impersonatedUserId: session.impersonatedUserId ?? raw,
      startedAt: session.startedAt ?? null,
      ...(impersonation != null && { impersonation }),
    });
  } catch {
    return NextResponse.json({
      active: true,
      impersonating: true,
      impersonatedUserId: raw,
      startedAt: null,
      ...(impersonation != null && { impersonation }),
    });
  }
}
