import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { requireSandboxV2Admin } from "@/lib/sandbox/adminAuth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sandboxId = req.nextUrl.searchParams.get("sandboxId");
  console.log("QUERY:", sandboxId);

  if (!sandboxId) {
    return NextResponse.json({ success: false, error: "Missing sandboxId" }, { status: 400 });
  }

  try {
    await requireSandboxV2Admin();
  } catch (authError) {
    const err = authError as { message?: string };
    console.error("FEATURE ROUTE ERROR", authError);
    return NextResponse.json({
      success: false,
      stage: "features_route",
      error: err?.message ?? "Unknown",
      details: authError,
    }, { status: 500 });
  }

  try {
    const supabase = getSupabaseServer();

    const { data: flags, error: flagsErr } = await supabase
      .from("feature_flags")
      .select("key, name");

    if (flagsErr) {
      console.error("FEATURE ROUTE ERROR", flagsErr);
      return NextResponse.json({
        success: false,
        stage: "features_route",
        error: (flagsErr as { message?: string })?.message ?? "Unknown",
        details: flagsErr,
      }, { status: 500 });
    }

    const { data: overrides, error: overridesErr } = await supabase
      .from("sandbox_feature_overrides")
      .select("feature_key, is_enabled")
      .eq("sandbox_id", sandboxId);

    if (overridesErr) {
      console.error("FEATURE ROUTE ERROR", overridesErr);
      return NextResponse.json({
        success: false,
        stage: "features_route",
        error: (overridesErr as { message?: string })?.message ?? "Unknown",
        details: overridesErr,
      }, { status: 500 });
    }

    const overrideMap = new Map((overrides ?? []).map((o) => [o.feature_key, o.is_enabled]));
    const features = (flags ?? []).map((f) => ({
      feature_key: f.key,
      label: f.name,
      enabled: overrideMap.get(f.key) ?? false,
    }));

    return NextResponse.json({ success: true, data: features, features });
  } catch (error) {
    const err = error as { message?: string };
    console.error("FEATURE ROUTE ERROR", error);
    return NextResponse.json({
      success: false,
      stage: "features_route",
      error: err?.message ?? "Unknown",
      details: error,
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    // ignore
  }
  console.log("BODY:", body);
  console.log("QUERY:", req.nextUrl.searchParams.get("sandboxId"));

  const sandboxId = body.sandboxId ?? body.sandbox_id ?? req.nextUrl.searchParams.get("sandboxId");
  const feature_key = body.feature_key ?? body.featureKey;
  const enabled = body.enabled === true || body.enabled === "true";

  if (!sandboxId) {
    return NextResponse.json({ success: false, error: "Missing sandboxId" }, { status: 400 });
  }
  if (!feature_key) {
    return NextResponse.json({ success: false, error: "Missing feature_key" }, { status: 400 });
  }

  let user: { id: string };
  try {
    user = await requireSandboxV2Admin();
  } catch (authError) {
    const err = authError as { message?: string };
    console.error("FEATURE ROUTE ERROR", authError);
    return NextResponse.json({
      success: false,
      stage: "features_route",
      error: err?.message ?? "Unknown",
      details: authError,
    }, { status: 500 });
  }

  try {
    const supabase = getSupabaseServer();
    const payload: Record<string, unknown> = {
      sandbox_id: sandboxId,
      feature_key,
      is_enabled: enabled,
      created_by: user.id,
    };

    const { data, error } = await supabase
      .from("sandbox_feature_overrides")
      .upsert(payload, { onConflict: "sandbox_id,feature_key" })
      .select("sandbox_id, feature_key, is_enabled")
      .single();

    if (error) {
      console.error("FEATURE ROUTE ERROR", error);
      return NextResponse.json({
        success: false,
        stage: "features_route",
        error: (error as { message?: string })?.message ?? "Unknown",
        details: error,
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: { feature_key: data.feature_key, label: data.feature_key, enabled: data.is_enabled },
      override: data,
    });
  } catch (error) {
    const err = error as { message?: string };
    console.error("FEATURE ROUTE ERROR", error);
    return NextResponse.json({
      success: false,
      stage: "features_route",
      error: err?.message ?? "Unknown",
      details: error,
    }, { status: 500 });
  }
}
