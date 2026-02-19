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

    const userId = auth.user.id;

    const supabaseAny = supabase as any;
    const { data: profile } = await supabaseAny
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    if (profile?.role !== "user") {
      return NextResponse.json(
        { error: "Only employees can upload resumes" },
        { status: 403 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("resume") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Missing resume file" }, { status: 400 });
    }

    const path = `${userId}/resume.pdf`;

    const { error: uploadError } = await supabase.storage
      .from("resumes")
      .upload(path, file, {
        upsert: true,
        contentType: file.type,
      });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const resumeUrl = `resumes/${path}`;

    await supabaseAny
      .from("profiles")
      .update({
        resume_url: resumeUrl,
        resume_uploaded_at: new Date().toISOString(),
      })
      .eq("id", userId);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Resume upload failed" },
      { status: 500 }
    );
  }
}
