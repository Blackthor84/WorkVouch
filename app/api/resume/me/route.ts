import { NextResponse } from "next/server";
import { admin } from "@/lib/supabase-admin";
import { getEffectiveUserId } from "@/lib/server/effectiveUserId";

export const runtime = "nodejs";

/**
 * GET /api/resume/me
 * Returns a signed URL for the current user's resume (for View/Download on profile).
 */
export async function GET() {
  try {
    const userId = await getEffectiveUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminAny = admin as any;
    const { data: profile, error: profileError } = await adminAny
      .from("profiles")
      .select("resume_url")
      .eq("id", userId)
      .single();

    if (profileError || !profile?.resume_url) {
      return NextResponse.json({ error: "No resume uploaded" }, { status: 404 });
    }

    const path = profile.resume_url.replace(/^resumes\//, "");

    const { data: signed, error } = await admin.storage
      .from("resumes")
      .createSignedUrl(path, 3600); // 1 hour

    if (error || !signed?.signedUrl) {
      return NextResponse.json(
        { error: "Failed to generate access link" },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: signed.signedUrl });
  } catch (e) {
    console.warn("[resume/me] error:", e);
    return NextResponse.json(
      { error: "Failed to retrieve resume" },
      { status: 500 }
    );
  }
}
