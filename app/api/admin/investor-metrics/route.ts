/**
 * GET /api/admin/investor-metrics
 * Real platform counts for investor dashboard. Superadmin only. Read-only.
 */
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

async function count(supabase: ReturnType<typeof getSupabaseServer>, table: string): Promise<number> {
  try {
    const { count, error } = await (supabase as any)
      .from(table)
      .select("*", { count: "exact", head: true });
    if (error) return 0;
    return typeof count === "number" ? count : 0;
  } catch {
    return 0;
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const roles = (session.user as { roles?: string[] }).roles ?? [];
    if (!roles.includes("superadmin")) {
      return NextResponse.json({ error: "Forbidden: superadmin only" }, { status: 403 });
    }

    const supabase = getSupabaseServer() as any;

    const [totalUsers, totalEmployers, verificationVolume, demoResult] = await Promise.all([
      count(supabase, "profiles"),
      count(supabase, "employer_accounts"),
      count(supabase, "verification_requests"),
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("demo_account", true),
    ]);

    const demoCount = typeof (demoResult as { count?: number })?.count === "number" ? (demoResult as { count: number }).count : 0;

    return NextResponse.json({
      totalUsers,
      totalEmployers,
      verificationVolume,
      demoAccounts: demoCount,
      // Exclude demo accounts from "real" user count for investor view
      realUsers: Math.max(0, totalUsers - demoCount),
    });
  } catch (e) {
    console.error("Investor metrics error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
