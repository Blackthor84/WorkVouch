/**
 * GET /api/admin/intelligence/breakdown?userId=... | ?sandboxId=...&employeeId=...
 * Admin only. Returns scoring breakdown for defensibility:
 * { totalScore, components: { tenure, reviewVolume, sentiment, rating, rehireMultiplier } }
 */
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, getCurrentUserRole } from "@/lib/auth";
import { calculateV1Breakdown, buildProductionProfileInput } from "@/lib/core/intelligence";
import { buildSandboxProfileInput } from "@/lib/sandbox/buildProfileInput";
import { calculateSentimentFromText } from "@/lib/sandbox/enterpriseEngine";
import { getSupabaseServer } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const role = await getCurrentUserRole();
    if (role !== "admin" && role !== "superadmin") {
      return NextResponse.json(
        { error: "Forbidden: admin or superadmin only" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const sandboxId = searchParams.get("sandboxId");
    const employeeId = searchParams.get("employeeId");

    if (userId) {
      const input = await buildProductionProfileInput(userId);
      const breakdown = calculateV1Breakdown(input);
      return NextResponse.json({
        totalScore: breakdown.totalScore,
        components: breakdown.components,
      });
    }

    if (sandboxId && employeeId) {
      const supabase = getSupabaseServer();
      const [reviewsRes, recordsRes] = await Promise.all([
        supabase
          .from("sandbox_peer_reviews")
          .select("reviewer_id, reviewed_id, rating, review_text, sentiment_score, reliability_score, teamwork_score, leadership_score, stress_performance_score")
          .eq("sandbox_id", sandboxId)
          .eq("reviewed_id", employeeId),
        supabase
          .from("sandbox_employment_records")
          .select("employee_id, tenure_months, rehire_eligible")
          .eq("sandbox_id", sandboxId)
          .eq("employee_id", employeeId),
      ]);
      const reviews = reviewsRes.data ?? [];
      const records = recordsRes.data ?? [];
      const input = buildSandboxProfileInput(
        reviews as Parameters<typeof buildSandboxProfileInput>[0],
        records as Parameters<typeof buildSandboxProfileInput>[1],
        calculateSentimentFromText
      );
      const breakdown = calculateV1Breakdown(input);
      return NextResponse.json({
        totalScore: breakdown.totalScore,
        components: breakdown.components,
      });
    }

    return NextResponse.json(
      { error: "Provide userId or (sandboxId and employeeId)" },
      { status: 400 }
    );
  } catch (e) {
    console.error("[admin intelligence breakdown]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Internal error" },
      { status: 500 }
    );
  }
}
