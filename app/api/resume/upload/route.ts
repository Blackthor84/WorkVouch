import { NextResponse } from "next/server";
import { admin } from "@/lib/supabase-admin";
import { insertActivityLog } from "@/lib/activity";
import { getEffectiveUserId } from "@/lib/server/effectiveUserId";
import { rejectWriteIfImpersonating } from "@/lib/server/rejectWriteIfImpersonating";
import { toProfileResumeUrl } from "@/lib/resume/path-utils";
import { resumeContentType, validateResumeFile } from "@/lib/resume/validate-upload";
import { RESUME_BUCKET } from "@/lib/resume/types";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const reject = await rejectWriteIfImpersonating();
    if (reject) return reject;

    const effectiveUserId = await getEffectiveUserId();
    if (!effectiveUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminAny = admin as { from: (t: string) => ReturnType<typeof admin.from> };
    const { data: profile } = await adminAny
      .from("profiles")
      .select("role")
      .eq("id", effectiveUserId)
      .single();

    const role = profile?.role;
    if (role !== "user" && role !== "employee") {
      return NextResponse.json(
        { error: "Only employees can upload resumes" },
        { status: 403 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("resume") as File | null;

    const validation = file ? validateResumeFile(file) : { ok: false as const, error: "Missing resume file" };
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const ext = file!.name.split(".").pop()!.toLowerCase();
    const fileName = `${effectiveUserId}-${Date.now()}.${ext}`;

    const { error: uploadError } = await admin.storage.from(RESUME_BUCKET).upload(fileName, file!, {
      upsert: true,
      contentType: file!.type || resumeContentType(ext),
    });

    if (uploadError) {
      return NextResponse.json({ error: "Upload failed. Please try again." }, { status: 500 });
    }

    const resumeUrl = toProfileResumeUrl(fileName);

    const { error: updateError } = await adminAny
      .from("profiles")
      .update({
        resume_url: resumeUrl,
        resume_uploaded_at: new Date().toISOString(),
      })
      .eq("id", effectiveUserId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    insertActivityLog({ userId: effectiveUserId, action: "resume_uploaded" }).catch(() => {});

    return NextResponse.json({
      success: true,
      /** Canonical storage key within the resumes bucket */
      path: fileName,
      /** Backward-compatible profile reference */
      url: resumeUrl,
    });
  } catch {
    return NextResponse.json({ error: "Upload failed, try again" }, { status: 500 });
  }
}
