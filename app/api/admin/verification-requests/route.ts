import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
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

    const supabaseAny = (await createServerClient()) as any;

    let query = supabaseAny
      .from("verification_requests")
      .select(
        `
        *,
        jobs!inner (
          id,
          company_name,
          job_title,
          user_id,
          profiles!jobs_user_id_fkey (
            full_name,
            email
          )
        )
      `,
      )
      .order("created_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    } else {
      query = query.eq("status", "pending");
    }

    const { data: requests, error } = await query;

    if (error) {
      console.error("Get verification requests error:", error);
      return NextResponse.json(
        { error: "Failed to fetch verification requests" },
        { status: 500 },
      );
    }

    // Normalize requests: convert string | null to string
    const safeRequests = (requests || []).map((request: any) => ({
      ...request,
      jobs: request.jobs
        ? {
            ...request.jobs,
            company_name: request.jobs.company_name ?? "",
            job_title: request.jobs.job_title ?? "",
            profiles: request.jobs.profiles
              ? {
                  ...request.jobs.profiles,
                  full_name: request.jobs.profiles.full_name ?? "",
                  email: request.jobs.profiles.email ?? "",
                }
              : null,
          }
        : null,
    }));

    return NextResponse.json({ requests: safeRequests });
  } catch (error) {
    console.error("Get verification requests error:", error);
    return NextResponse.json(
      { error: "Failed to fetch verification requests" },
      { status: 500 },
    );
  }
}
