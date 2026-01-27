import { NextRequest, NextResponse } from "next/server";
import { getRehireData } from "@/lib/actions/employer/analytics";
import { getCurrentUser, hasRole } from "@/lib/auth";
import { createServerSupabase } from "@/lib/supabase/server";

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

    const searchParams = req.nextUrl.searchParams;
    const employerId = searchParams.get("employerId");

    if (!employerId) {
      // Get employer account ID from user
      const supabase = await createServerSupabase();
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
      const rehireData = await getRehireData(employerAccountTyped.id);
      return NextResponse.json({ data: rehireData });
    }

    const rehireData = await getRehireData(employerId);
    return NextResponse.json({ data: rehireData });
  } catch (error: any) {
    console.error("Rehire data error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch rehire data" },
      { status: 500 },
    );
  }
}
