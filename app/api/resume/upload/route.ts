import { NextResponse } from "next/server";
import { admin } from "@/lib/supabase-admin";
import { insertActivityLog } from "@/lib/activity";
import { getEffectiveUserId } from "@/lib/server/effectiveUserId";
import { rejectWriteIfImpersonating } from "@/lib/server/rejectWriteIfImpersonating";

export const runtime = "nodejs";

const ALLOWED_EXTENSIONS = ["pdf", "doc", "docx"];
const ALLOWED_TYPES = [
  "application/pdf",
  "application/msword", // .doc
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
];
const MAX_BYTES = 5 * 1024 * 1024; // 5MB

export async function POST(req: Request) {
  try {
    const reject = await rejectWriteIfImpersonating();
    if (reject) return reject;

    const effectiveUserId = await getEffectiveUserId();
    if (!effectiveUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminAny = admin as any;
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

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "Missing resume file" }, { status: 400 });
    }

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
      return NextResponse.json(
        { error: "Invalid file type. Only PDF, DOC, and DOCX are allowed." },
        { status: 400 }
      );
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only PDF, DOC, and DOCX are allowed." },
        { status: 400 }
      );
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "File size exceeds 5MB limit." },
        { status: 400 }
      );
    }

    const fileName = `${effectiveUserId}-${Date.now()}.${ext}`;
    const filePath = fileName;

    const { error: uploadError } = await admin.storage
      .from("resumes")
      .upload(filePath, file, {
        upsert: true,
        contentType: file.type,
      });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const resumeUrl = `resumes/${filePath}`;

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

    return NextResponse.json({ success: true, url: resumeUrl });
  } catch (e) {
    console.warn("[resume/upload] error:", e);
    return NextResponse.json(
      { error: "Upload failed, try again" },
      { status: 500 }
    );
  }
}
