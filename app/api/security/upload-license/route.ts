import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createServerSupabase } from "@/lib/supabase/server";

/**
 * POST /api/security/upload-license
 * Upload a guard license or certificate (Security Bundle feature)
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has Security Bundle plan
    const supabase = await createServerSupabase();
    const supabaseAny = supabase as any;

    const { data: employerAccount } = await supabaseAny
      .from("employer_accounts")
      .select("plan_tier")
      .eq("user_id", user.id)
      .single();

    if (employerAccount?.plan_tier !== "security-bundle") {
      return NextResponse.json(
        { error: "Security Bundle plan required" },
        { status: 403 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const type = formData.get("type") as string; // "license" or "certificate"

    if (!file) {
      return NextResponse.json(
        { error: "File is required" },
        { status: 400 }
      );
    }

    // TODO: Upload to Supabase Storage
    // For now, return success with mock data
    const licenseData = {
      id: `license_${Date.now()}`,
      name: file.name,
      type: type,
      uploadedAt: new Date().toISOString(),
      expirationDate: null, // Would be extracted from file
    };

    return NextResponse.json({
      success: true,
      license: licenseData,
    });
  } catch (error: any) {
    console.error("License upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload license" },
      { status: 500 }
    );
  }
}
