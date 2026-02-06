import { NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/serviceRole";
import { requireSandboxV2Admin } from "@/lib/sandbox/adminAuth";

export async function GET(req: Request) {
  try {
    await requireSandboxV2Admin();
    const { searchParams } = new URL(req.url);
    const sandboxId = searchParams.get("sandboxId");

    if (!sandboxId) {
      return NextResponse.json({ features: [] });
    }

    const supabase = getServiceRoleClient();

    const { data, error } = await supabase
      .from("sandbox_features")
      .select("*")
      .eq("sandbox_id", sandboxId);

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { success: false, stage: "supabase_select", error: error.message, details: error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      features: data ?? []
    });

  } catch (err) {
    console.error("SANDBOX FEATURES FATAL:", err);
    return NextResponse.json(
      { success: false, stage: "features_route", error: String(err) },
      { status: 500 }
    );
  }
}
