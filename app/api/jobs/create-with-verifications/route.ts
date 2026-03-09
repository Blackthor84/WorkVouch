import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth/getUser";
import { admin } from "@/lib/supabase-admin";
import { createClient } from "@/lib/supabase/server";
import { randomBytes } from "crypto";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const employmentTypes = ["full_time", "part_time", "contract", "internship", "temporary", "freelance"] as const;

const schema = z.object({
  company_name: z.string().min(1, "Company name is required"),
  job_title: z.string().min(1, "Job title is required"),
  start_date: z.string().min(1, "Start date is required"),
  end_date: z.string().nullable().optional(),
  is_current: z.boolean().optional().default(false),
  employment_type: z.enum(employmentTypes).default("full_time"),
  location: z.string().nullable().optional(), // "State, Country" per privacy rule
  supervisor_name: z.string().nullable().optional(),
  coworker_emails: z.array(z.string().email()).default([]),
});

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parse = schema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json(
      { error: parse.error.flatten().fieldErrors ? Object.values(parse.error.flatten().fieldErrors).flat().join(" ") : "Validation failed" },
      { status: 400 }
    );
  }

  const data = parse.data;
  const end_date = data.is_current ? null : (data.end_date || null);
  const supabase = await createClient();
  const adminAny = admin as any;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();
  const requesterProfileId = (profile as { id: string } | null)?.id ?? user.id;

  const { data: job, error: jobError } = await adminAny
    .from("jobs")
    .insert({
      user_id: user.id,
      company_name: data.company_name.trim(),
      job_title: data.job_title.trim(),
      employment_type: data.employment_type,
      start_date: data.start_date,
      end_date,
      is_current: !!data.is_current,
      location: data.location?.trim() || null,
      supervisor_name: data.supervisor_name?.trim() || null,
      verification_status: "unverified",
      is_private: false,
    })
    .select("id")
    .single();

  if (jobError || !job) {
    console.error("Job insert error:", jobError);
    return NextResponse.json({ error: jobError?.message ?? "Failed to create job" }, { status: 500 });
  }

  const jobId = (job as { id: string }).id;
  const normalizedEmails = [...new Set(data.coworker_emails.map((e) => e.trim().toLowerCase()).filter(Boolean))];
  const created: string[] = [];

  for (const email of normalizedEmails) {
    const responseToken = randomBytes(32).toString("base64url");
    const { error: vrError } = await adminAny.from("verification_requests").insert({
      job_id: jobId,
      requester_profile_id: requesterProfileId,
      target_email: email,
      status: "pending",
      response_token: responseToken,
      relationship_type: "coworker",
      delivery_method: "email",
    });
    if (!vrError) created.push(email);
  }

  return NextResponse.json({
    job_id: jobId,
    verification_requests_sent: created.length,
    coworker_emails: created,
  });
}
