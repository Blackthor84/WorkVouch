/**
 * POST /api/sandbox/fuzzer/run — run Scenario Fuzzer. Admin-only.
 * Body: { sandbox_id, attack_type, actor_resolution, mode?, seed? }
 * Generates valid DSL, runs via real runner, logs to sandbox_events, stores snapshots.
 */

import { NextRequest, NextResponse } from "next/server";
import { sandboxAdminGuard } from "@/lib/server/sandboxGuard";
import { getAuthedUser } from "@/lib/auth/getAuthedUser";
import { runFuzzer } from "@/lib/sandbox/dsl/fuzzer/runFuzzer";
import type { FuzzAttackType } from "@/lib/sandbox/dsl/fuzzer/generators";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

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
    const attack_type = (body.attack_type ?? body.attackType) as FuzzAttackType | undefined;
    const actor_resolution = (body.actor_resolution ?? body.actorResolution) as Record<string, string> | undefined;
    const mode = (body.mode as "safe" | "real" | undefined) ?? "safe";
    const seed = body.seed as number | undefined;

    if (!sandbox_id || !attack_type) {
      return NextResponse.json(
        { error: "Missing sandbox_id or attack_type" },
        { status: 400 }
      );
    }
    const validTypes: FuzzAttackType[] = ["boost_rings", "retaliation", "oscillation", "impersonation_spam"];
    if (!validTypes.includes(attack_type)) {
      return NextResponse.json(
        { error: `Invalid attack_type. Use one of: ${validTypes.join(", ")}` },
        { status: 400 }
      );
    }
    const resolution = actor_resolution && typeof actor_resolution === "object"
      ? { ...actor_resolution, admin: authed.user.id }
      : { admin: authed.user.id };

    const record = await runFuzzer({
      sandbox_id,
      admin_user_id: authed.user.id,
      actor_resolution: resolution,
      attack_type,
      mode,
      seed,
    });

    return NextResponse.json(record);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[sandbox/fuzzer/run]", e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
