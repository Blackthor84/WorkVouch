import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { calculateUserScore } from "@/lib/scoring/engine";
import { z } from "zod";

const approveVerificationSchema = z.object({
  verificationRequestId: z.string().uuid(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = await isAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const data = approveVerificationSchema.parse(body);

    const supabase = await createServerSupabase();

    // Type definitions for verification_requests (not in Database types yet)
    type VerificationRequestRow = {
      id: string;
      job_id: string;
      status: string;
    };
    type VerificationRequestUpdate = { status?: string };

    // Get verification request to find job_id
    const supabaseAny = supabase as any;
    const { data: verificationRequest, error: fetchError } = await supabaseAny
      .from("verification_requests")
      .select("id, job_id, requested_by_id")
      .eq("id", data.verificationRequestId)
      .single();

    if (fetchError || !verificationRequest) {
      return NextResponse.json(
        { error: "Verification request not found" },
        { status: 404 },
      );
    }

    // Update verification request
    const { data: updatedRequest, error: updateError } = await supabaseAny
      .from("verification_requests")
      .update({ status: "approved" } as Partial<VerificationRequestUpdate>)
      .eq("id", data.verificationRequestId)
      .select()
      .single();

    if (updateError) {
      console.error("Update verification request error:", updateError);
      return NextResponse.json(
        { error: "Failed to update verification request" },
        { status: 500 },
      );
    }

    // Update job history verification status
    // Note: verification_status field may not be in Database types yet
    const { error: jobUpdateError } = await (supabase as any)
      .from("jobs")
      .update({ verification_status: "verified" })
      .eq("id", verificationRequest.job_id);

    if (jobUpdateError) {
      console.error("Update job error:", jobUpdateError);
      return NextResponse.json(
        { error: "Failed to update job verification status" },
        { status: 500 },
      );
    }

    try {
      const { data: job } = await supabaseAny
        .from("jobs")
        .select("user_id")
        .eq("id", verificationRequest.job_id)
        .single();
      const userId = (job as { user_id?: string } | null)?.user_id;
      if (userId) {
        await calculateUserScore(userId, "rehire");
        const { calculateAndStoreRisk } = await import("@/lib/risk/calculateAndPersist");
        try {
          await calculateAndStoreRisk(userId);
        } catch (err: unknown) {
          console.error("[API][approve-verification] calculateAndStoreRisk", { userId, err });
        }
        const { calculateCredentialScore } = await import("@/lib/security/credentialScore");
        try {
          await calculateCredentialScore(userId);
        } catch (err: unknown) {
          console.error("[API][approve-verification] calculateCredentialScore", { userId, err });
        }
        const { triggerProfileIntelligence, triggerEmployerIntelligence } = await import("@/lib/intelligence/engines");
        try {
          await triggerProfileIntelligence(userId);
        } catch (err: unknown) {
          console.error("[API][approve-verification] triggerProfileIntelligence", { userId, err });
        }
        const vr = verificationRequest as { requested_by_id?: string };
        if (vr?.requested_by_id) {
          try {
            await triggerEmployerIntelligence(vr.requested_by_id);
          } catch (err: unknown) {
            console.error("[API][approve-verification] triggerEmployerIntelligence", { requestedById: vr.requested_by_id, err });
          }
        }
      }
    } catch (err: unknown) {
      console.error("[API][approve-verification] scoring/rehire", { err });
    }

    return NextResponse.json({
      success: true,
      verificationRequest: updatedRequest,
    });
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: err.issues },
        { status: 400 },
      );
    }
    console.error("[API][approve-verification]", { err });
    return NextResponse.json(
      { error: "Failed to approve verification" },
      { status: 500 },
    );
  }
}
