import { NextRequest, NextResponse } from "next/server";
import { getTrustScoresForEmployer } from "@/lib/actions/employer/analytics";
import { getCurrentUser, hasRole } from "@/lib/auth";
import { createServerSupabase } from "@/lib/supabase/server";
import { requireActiveSubscription } from "@/lib/employer-require-active-subscription";

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

    const subCheck = await requireActiveSubscription(user.id);
    if (!subCheck.allowed) {
      return NextResponse.json(
        { error: subCheck.error ?? "Active subscription required." },
        { status: 403 },
      );
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
      const trustScores = await getTrustScoresForEmployer(
        employerAccountTyped.id,
      );
      return NextResponse.json({ data: trustScores });
    }

    const trustScores = await getTrustScoresForEmployer(employerId);
    return NextResponse.json({ data: trustScores });
  } catch (error: any) {
    console.error("Trust scores error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch trust scores" },
      { status: 500 },
    );
  }
}
