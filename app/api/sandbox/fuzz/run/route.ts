/**
 * POST /api/sandbox/fuzz/run — run Scenario Fuzzer. Admin-only.
 * Body: { sandbox_id, attack_type, actor_resolution | employee_ids, seed?, mode? }
 * actor_resolution: { employee_1: uuid, employee_2: uuid, ..., admin?: uuid }
 * Or employee_ids: [uuid, uuid, ...] → employee_1, employee_2, ...; admin added automatically.
 */

import { NextRequest, NextResponse } from "next/server";
import { sandboxAdminGuard } from "@/lib/server/sandboxGuard";
import { getAuthedUser } from "@/lib/auth/getAuthedUser";
import { runFuzzer } from "@/lib/sandbox/dsl/fuzzer/runFuzzer";
import type { FuzzAttackType } from "@/lib/sandbox/dsl/fuzzer/generators";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ATTACK_TYPES: FuzzAttackType[] = ["boost_rings", "retaliation", "oscillation", "impersonation_spam"];

export async function POST(req: NextRequest) {
  const guard = await sandboxAdminGuard();
  if (!guard.allowed) return guard.response;

  const authed = await getAuthedUser();
  if (!authed?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const sandbox_id = (body.sandbox_id ?? body.sandboxId) as string | undefined;
    const attack_type = body.attack_type as FuzzAttackType | undefined;
    const actor_resolution = body.actor_resolution as Record<string, string> | undefined;
    const employee_ids = body.employee_ids as string[] | undefined;
    const seed = body.seed as number | undefined;
    const mode = (body.mode === "real" ? "real" : "safe") as "safe" | "real";

    if (!sandbox_id) {
      return NextResponse.json({ error: "Missing sandbox_id" }, { status: 400 });
    }
    if (attack_type == null) {
      return NextResponse.json({ error: "Missing attack_type" }, { status: 400 });
    }
    if (!ATTACK_TYPES.includes(attack_type)) {
      return NextResponse.json(
        { error: `attack_type must be one of: ${ATTACK_TYPES.join(", ")}` },
        { status: 400 }
      );
    }

    let resolution: Record<string, string> = { ...actor_resolution, admin: authed.user.id };
    if (!actor_resolution && Array.isArray(employee_ids) && employee_ids.length > 0) {
      resolution = { admin: authed.user.id };
      employee_ids.forEach((id, i) => {
        resolution[`employee_${i + 1}`] = id;
      });
    }
    if (Object.keys(resolution).length <= 1) {
      return NextResponse.json(
        { error: "Provide actor_resolution or employee_ids (at least one employee)" },
        { status: 400 }
      );
    }

    const run = await runFuzzer({
      sandbox_id,
      admin_user_id: authed.user.id,
      actor_resolution: resolution,
      attack_type,
      seed,
      mode,
    });

    return NextResponse.json(run);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    console.error("[sandbox/fuzz/run]", e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
