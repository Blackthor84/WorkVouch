import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { Database } from "@/types/database";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      warehouseType,
      equipmentOperated,
      responsibilities,
      certifications,
    } = body;

    // Validate required fields
    if (!warehouseType) {
      return NextResponse.json(
        { error: "Warehouse type is required" },
        { status: 400 },
      );
    }

    const supabase = await createServerSupabaseClient();

    // Update the profile with warehouse-specific data
    // Note: warehouse-specific fields may not be in Database types yet
    const { error: updateError } = await (supabase as any)
      .from("profiles")
      .update({
        warehouse_type: warehouseType,
        equipment_operated: equipmentOperated || [],
        warehouse_responsibilities: responsibilities || [],
        warehouse_certifications: certifications || [],
      })
      .eq("id", user.id);

    if (updateError) {
      console.error("Error updating warehouse data:", updateError);
      return NextResponse.json(
        { error: "Failed to save warehouse data" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Warehouse API error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
