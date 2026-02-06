import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const sandboxId = searchParams.get("sandboxId");

    if (!sandboxId) {
      return NextResponse.json(
        { success: false, message: "Missing sandboxId" },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabase();

    const { data, error } = await supabase
      .from("sandbox_features")
      .select("*")
      .eq("sandbox_id", sandboxId);

    if (error) {
      console.error("SANDBOX FEATURES ERROR:", error);
      return NextResponse.json(
        { success: false, stage: "supabase_select", error },
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
      { success: false, error: String(err) },
      { status: 500 }
    );
  }
}
