import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { randomBytes } from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const supabase = await createClient();

  const body = await req.json().catch(() => ({}));
  const {
    company_name,
    job_title,
    state,
    start_date,
    end_date,
    coworkers = [],
  } = body;

  const { data: authData } = await supabase.auth.getUser();
  const user = authData?.user;

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  if (!company_name?.trim() || !job_title?.trim() || !start_date) {
    return NextResponse.json(
      { error: "company_name, job_title, and start_date are required" },
      { status: 400 }
    );
  }

  const supabaseAny = supabase as any;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();
  const requesterProfileId = (profile as { id: string } | null)?.id ?? user.id;

  const locationStr = state?.trim() ? String(state).trim() : null;

  const { data: job, error } = await supabaseAny
    .from("jobs")
    .insert({
      user_id: user.id,
      company_name: String(company_name).trim(),
      title: String(job_title).trim(),
      start_date: String(start_date),
      end_date: end_date ? String(end_date) : null,
      is_current: !end_date,
      employment_type: "full_time",
      location: locationStr,
      verification_status: "unverified",
      is_private: false,
    })
    .select()
    .single();

  if (error) {
    console.error("Job insert error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const emails = Array.isArray(coworkers)
    ? [...new Set(coworkers.map((e: string) => String(e).trim().toLowerCase()).filter(Boolean))]
    : [];

  for (const email of emails) {
    const responseToken = randomBytes(32).toString("base64url");
    await supabaseAny.from("verification_requests").insert({
      job_id: job.id,
      requester_profile_id: requesterProfileId,
      target_email: email,
      status: "pending",
      response_token: responseToken,
      relationship_type: "coworker",
      delivery_method: "email",
    });
  }

  return NextResponse.json({
    success: true,
    job_id: job.id,
    verification_requests_sent: emails.length,
  });
}
