import { NextRequest, NextResponse } from "next/server";
import { admin } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  const { token } = await context.params;
  if (!token) {
    return new NextResponse("Invalid verification", { status: 400 });
  }

  const adminAny = admin as any;

  const { data: request, error: fetchError } = await adminAny
    .from("verification_requests")
    .select("id, job_id, target_email, status")
    .eq("response_token", token)
    .maybeSingle();

  if (fetchError || !request) {
    return new NextResponse("Invalid verification", { status: 404 });
  }

  const row = request as { job_id?: string; target_email?: string; status?: string };
  if (row.status !== "pending") {
    return new NextResponse("Verification already used", { status: 400 });
  }

  const jobId = row.job_id;
  const verifierEmail = row.target_email ?? null;

  if (!jobId) {
    return new NextResponse("Invalid verification", { status: 400 });
  }

  await adminAny.from("job_verifications").insert({
    job_id: jobId,
    verifier_email: verifierEmail,
  });

  await adminAny
    .from("verification_requests")
    .update({
      status: "accepted",
      responded_at: new Date().toISOString(),
    })
    .eq("response_token", token);

  return new NextResponse("Verification recorded", {
    status: 200,
    headers: { "Content-Type": "text/plain" },
  });
}
