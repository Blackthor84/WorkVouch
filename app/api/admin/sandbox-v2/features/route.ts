import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { requireSandboxV2Admin } from "@/lib/sandbox/adminAuth";

export const dynamic = "force-dynamic";

function structuredError(stage: string, error: string, details?: unknown) {
  return { success: false, stage, error, ...(details != null && { details }) };
}

export async function GET(req: NextRequest) {
  try {
    await requireSandboxV2Admin();
    const sandboxId = req.nextUrl.searchParams.get("sandboxId")?.trim() ?? null;

    if (!sandboxId) {
      return NextResponse.json(structuredError("validation", "Missing sandboxId"), { status: 400 });
    }

    const supabase = getSupabaseServer();

    const { data: flags, error: flagsErr } = await supabase
      .from("feature_flags")
      .select("key, name");

    if (flagsErr) {
      console.error("FEATURE ROUTE ERROR", flagsErr);
      return NextResponse.json(structuredError("feature_flags", flagsErr.message, { code: flagsErr.code }), { status: 500 });
    }

    const { data: overrides, error: overridesErr } = await supabase
      .from("sandbox_feature_overrides")
      .select("feature_key, is_enabled")
      .eq("sandbox_id", sandboxId);

    if (overridesErr) {
      console.error("FEATURE ROUTE ERROR", overridesErr);
      return NextResponse.json(structuredError("sandbox_feature_overrides", overridesErr.message, { code: overridesErr.code }), { status: 500 });
    }

    const overrideMap = new Map((overrides ?? []).map((o) => [o.feature_key, o.is_enabled]));

    const features = (flags ?? []).map((f) => ({
      feature_key: f.key,
      label: f.name,
      enabled: overrideMap.get(f.key) ?? false,
    }));

    return NextResponse.json({ success: true, data: features, features });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("FEATURE ROUTE ERROR", e);
    if (msg === "Unauthorized") return NextResponse.json(structuredError("auth", msg), { status: 401 });
    if (msg.startsWith("Forbidden")) return NextResponse.json(structuredError("auth", msg), { status: 403 });
    return NextResponse.json(structuredError("server", msg), { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireSandboxV2Admin();
    const body = await req.json().catch(() => ({}));
    const sandboxId = (body.sandbox_id ?? body.sandboxId) as string | undefined;
    const feature_key = (body.feature_key ?? body.featureKey) as string | undefined;
    const enabled = body.enabled === true || body.enabled === "true";

    if (!sandboxId || typeof sandboxId !== "string") {
      return NextResponse.json(structuredError("validation", "Missing sandboxId"), { status: 400 });
    }
    if (!feature_key || typeof feature_key !== "string") {
      return NextResponse.json(structuredError("validation", "Missing feature_key"), { status: 400 });
    }

    const supabase = getSupabaseServer();
    const { data, error } = await supabase
      .from("sandbox_feature_overrides")
      .upsert({ sandbox_id: sandboxId, feature_key, is_enabled: enabled }, { onConflict: "sandbox_id,feature_key" })
      .select("sandbox_id, feature_key, is_enabled")
      .single();

    if (error) {
      console.error("FEATURE ROUTE ERROR", error);
      return NextResponse.json(structuredError("supabase_upsert", error.message, { code: error.code }), { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: { feature_key: data.feature_key, label: data.feature_key, enabled: data.is_enabled },
      override: data,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("FEATURE ROUTE ERROR", e);
    if (msg === "Unauthorized") return NextResponse.json(structuredError("auth", msg), { status: 401 });
    if (msg.startsWith("Forbidden")) return NextResponse.json(structuredError("auth", msg), { status: 403 });
    return NextResponse.json(structuredError("server", msg), { status: 500 });
  }
}
