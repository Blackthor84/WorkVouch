import { NextRequest, NextResponse } from "next/server";
import { checkVerificationLimit } from "@/lib/utils/verification-limit";
import { getCurrentUser, hasRole } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// Mark route as dynamic
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isEmployer = await hasRole("employer");
    if (!isEmployer) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Get employer account ID
    const supabase = await createSupabaseServerClient();
    const supabaseAny = supabase as any;
    type EmployerAccountRow = { id: string };
    const { data: employerAccount } = await supabaseAny
      .from("employer_accounts")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!employerAccount) {
      return NextResponse.json(
        { error: "Employer account not found" },
        { status: 404 },
      );
    }

    const employerAccountTyped = employerAccount as EmployerAccountRow;

    // Check verification limit
    const result = await checkVerificationLimit(employerAccountTyped.id);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Verification limit check error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to check verification limit" },
      { status: 500 },
    );
  }
}
