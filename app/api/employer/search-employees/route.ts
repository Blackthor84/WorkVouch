import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
import { createServerSupabase } from "@/lib/supabase/server";
import { getCurrentUser, hasRole } from "@/lib/auth";
import { canViewEmployees } from "@/lib/middleware/plan-enforcement-supabase";
import { requireActiveSubscription } from "@/lib/employer-require-active-subscription";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isEmployer = await hasRole("employer");
    if (!isEmployer) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const subCheck = await requireActiveSubscription(user.id);
    if (!subCheck.allowed) {
      return NextResponse.json(
        { error: subCheck.error ?? "Active subscription required." },
        { status: 403 },
      );
    }

    const hasAccess = await canViewEmployees(user.id);
    if (!hasAccess) {
      return NextResponse.json(
        {
          error:
            "This feature requires a paid plan. Please upgrade to Pro or Custom.",
        },
        { status: 403 },
      );
    }

    const supabase = await createServerSupabase();
    const supabaseAny = supabase as any;
    const { data: employerAccount } = await supabaseAny
      .from("employer_accounts")
      .select("company_name")
      .eq("user_id", user.id)
      .single();

    const { searchParams } = new URL(req.url);
    const name = searchParams.get("name");
    const tradeSlug = searchParams.get("trade") ?? searchParams.get("tradeSlug");
    const companyName =
      searchParams.get("companyName") || employerAccount?.company_name;

    if (!name || name.length < 2) {
      return NextResponse.json({ employees: [] });
    }

    if (!companyName) {
      return NextResponse.json(
        { error: "Company name not found" },
        { status: 404 },
      );
    }

    let userIdsFilter: string[] | null = null;
    if (tradeSlug && tradeSlug.trim()) {
      const { data: tradeRow } = await supabase
        .from("trades")
        .select("id")
        .eq("slug", tradeSlug.trim())
        .maybeSingle();
      if (tradeRow?.id) {
        const { data: pt } = await supabase
          .from("profile_trades")
          .select("profile_id")
          .eq("trade_id", tradeRow.id);
        userIdsFilter = (pt ?? []).map((r) => r.profile_id);
        if (userIdsFilter.length === 0) {
          return NextResponse.json({ employees: [] });
        }
      }
    }

    let query = supabase
      .from("jobs")
      .select(
        `
        id,
        user_id,
        job_title,
        start_date,
        end_date,
        verification_status,
        is_visible_to_employer,
        company_name,
        profiles!inner (
          id,
          full_name,
          industry
        )
      `
      )
      .ilike("company_name", companyName)
      .ilike("profiles.full_name", `%${name}%`)
      .order("start_date", { ascending: false });

    if (userIdsFilter && userIdsFilter.length > 0) {
      query = query.in("user_id", userIdsFilter);
    }

    const { data: jobs, error: jobsError } = await query;

    if (jobsError) {
      console.error("Search employees error:", jobsError);
      return NextResponse.json(
        { error: "Failed to search employees" },
        { status: 500 },
      );
    }

    const visibleJobs = (jobs || []).filter(
      (job: any) => job.is_visible_to_employer || true
    );

    const employeesWithReferences = await Promise.all(
      visibleJobs.map(async (job: any) => {
        const { data: references } = await supabase
          .from("user_references")
          .select(
            `
            id,
            rating,
            written_feedback,
            from_user_id,
            profiles!references_from_user_id_fkey (
              full_name
            )
          `
          )
          .eq("job_id", job.id)
          .eq("to_user_id", job.user_id);

        return {
          userId: job.user_id,
          jobId: job.id,
          name: job.profiles?.full_name || null,
          industry: job.profiles?.industry || null,
          jobTitle: job.job_title,
          startDate: job.start_date,
          endDate: job.end_date,
          verificationStatus: job.verification_status,
          isVisibleToEmployer: job.is_visible_to_employer,
          references: (references || []).map((ref: any) => ({
            id: ref.id,
            fromUserName: ref.profiles?.full_name || null,
            rating: ref.rating,
            message: ref.written_feedback,
          })),
        };
      }),
    );

    return NextResponse.json({ employees: employeesWithReferences });
  } catch (error) {
    console.error("Search employees error:", error);
    return NextResponse.json(
      { error: "Failed to search employees" },
      { status: 500 },
    );
  }
}
