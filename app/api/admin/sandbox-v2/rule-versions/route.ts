/**
 * GET/POST rule versions. Sandbox context. Immutable versions.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireSandboxV2AdminWithRole } from "@/lib/sandbox/adminAuth";
import { listRuleVersions, createRuleVersion, type RuleSetName } from "@/lib/sandbox/rules/versioning";

const RULE_SETS: RuleSetName[] = ["trust_score_formula", "overlap_verification", "review_weighting", "penalty_thresholds", "fraud_detection_thresholds"];

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await requireSandboxV2AdminWithRole();
    const ruleSetName = req.nextUrl.searchParams.get("rule_set") ?? undefined;
    const versions = await listRuleVersions(ruleSetName);
    return NextResponse.json({ success: true, data: versions });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Forbidden";
    if (msg.includes("Forbidden")) return NextResponse.json({ error: msg }, { status: 403 });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { id: userId } = await requireSandboxV2AdminWithRole();
    const body = await req.json().catch(() => ({}));
    const ruleSetName = body.rule_set_name ?? body.ruleSetName;
    const versionTag = body.version_tag ?? body.versionTag;
    const config = body.config ?? {};
    if (!ruleSetName || !versionTag) return NextResponse.json({ error: "rule_set_name and version_tag required" }, { status: 400 });
    if (!RULE_SETS.includes(ruleSetName as RuleSetName)) return NextResponse.json({ error: "Invalid rule_set_name" }, { status: 400 });
    const result = await createRuleVersion({
      ruleSetName: ruleSetName as RuleSetName,
      versionTag,
      config,
      setActiveSandbox: body.set_active_sandbox ?? body.setActiveSandbox ?? false,
      setActiveProduction: false,
      createdBy: userId,
    });
    if (!result) return NextResponse.json({ error: "Failed to create rule version" }, { status: 500 });
    return NextResponse.json({ success: true, id: result.id });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Forbidden";
    if (msg.includes("Forbidden")) return NextResponse.json({ error: msg }, { status: 403 });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
