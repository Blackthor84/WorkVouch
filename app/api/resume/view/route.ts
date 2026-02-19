import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const supabase = await supabaseServer();
    const { data: auth } = await supabase.auth.getUser();

    if (!auth?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const employerId = auth.user.id;

    const supabaseAny = supabase as any;
    const { data: employer } = await supabaseAny
      .from("profiles")
      .select("role, subscription_tier, subscription_expires_at")
      .eq("id", employerId)
      .single();

    if (employer?.role === "employer" && employer?.subscription_tier === "free") {
      return NextResponse.json(
        { error: "Upgrade required" },
        { status: 402 }
      );
    }

    if (
      employer?.role !== "employer" ||
      !employer?.subscription_expires_at ||
      new Date(employer.subscription_expires_at) < new Date()
    ) {
      return NextResponse.json(
        { error: "Active subscription required" },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { user_id } = body;

    if (!user_id) {
      return NextResponse.json({ error: "Missing user_id" }, { status: 400 });
    }

    const { data: target } = await supabaseAny
      .from("profiles")
      .select("resume_url")
      .eq("id", user_id)
      .single();

    if (!target?.resume_url) {
      return NextResponse.json(
        { error: "Resume not found" },
        { status: 404 }
      );
    }

    const path = target.resume_url.replace("resumes/", "");

    const { data: signed, error } = await supabase.storage
      .from("resumes")
      .createSignedUrl(path, 60); // 60 seconds

    if (error || !signed?.signedUrl) {
      return NextResponse.json(
        { error: "Failed to generate access link" },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: signed.signedUrl });
  } catch {
    return NextResponse.json(
      { error: "Failed to retrieve resume" },
      { status: 500 }
    );
  }
}
