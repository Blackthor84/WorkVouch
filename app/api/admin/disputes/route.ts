import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { getCurrentUser, isAdmin } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = await isAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const supabase = await createServerSupabase();

    let query: any = supabase
      .from("employer_disputes")
      .select(
        `
        *,
        employer_accounts!inner (
          id,
          company_name,
          user_id,
          profiles!employer_accounts_user_id_fkey (
            email
          )
        ),
        jobs!inner (
          id,
          user_id,
          company_name,
          job_title,
          profiles!jobs_user_id_fkey (
            id,
            full_name,
            email
          )
        )
      `,
      )
      .order("created_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    const { data: disputes, error } = await query;

    if (error) {
      console.error("Get disputes error:", error);
      return NextResponse.json(
        { error: "Failed to fetch disputes" },
        { status: 500 },
      );
    }

    // Get documents for each dispute
    const disputesWithDocuments = await Promise.all(
      (disputes || []).map(async (dispute: any) => {
        const { data: documents } = await supabase
          .from("dispute_documents")
          .select("id, document_type, file_name, file_url, created_at")
          .eq("dispute_id", dispute.id)
          .order("created_at", { ascending: false });

        return {
          id: dispute.id,
          employerAccountId: dispute.employer_account_id,
          jobHistoryId: dispute.job_id,
          disputeReason: dispute.dispute_reason,
          status: dispute.status,
          createdAt: dispute.created_at,
          updatedAt: dispute.updated_at,
          employerAccount: {
            id: dispute.employer_accounts.id,
            companyName: dispute.employer_accounts.company_name,
            email: dispute.employer_accounts.profiles?.email,
          },
          jobHistory: {
            id: dispute.jobs.id,
            userId: dispute.jobs.user_id,
            employerName: dispute.jobs.company_name,
            jobTitle: dispute.jobs.job_title,
            user: {
              id: dispute.jobs.profiles?.id,
              name: dispute.jobs.profiles?.full_name,
              email: dispute.jobs.profiles?.email,
            },
            documents: documents || [],
          },
        };
      }),
    );

    return NextResponse.json({ disputes: disputesWithDocuments });
  } catch (error) {
    console.error("Get disputes error:", error);
    return NextResponse.json(
      { error: "Failed to fetch disputes" },
      { status: 500 },
    );
  }
}
