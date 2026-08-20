/**
 * DELETE /api/resume
 * Remove stored resume file and profile reference. Does NOT delete employment records.
 */

import { NextResponse } from "next/server";
import { admin } from "@/lib/supabase-admin";
import { getEffectiveUserId } from "@/lib/server/effectiveUserId";
import { rejectWriteIfImpersonating } from "@/lib/server/rejectWriteIfImpersonating";
import { toStoragePath } from "@/lib/resume/path-utils";
import { RESUME_BUCKET } from "@/lib/resume/types";

export const runtime = "nodejs";

export async function DELETE() {
  try {
    const reject = await rejectWriteIfImpersonating();
    if (reject) return reject;

    const userId = await getEffectiveUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminAny = admin as { from: (t: string) => ReturnType<typeof admin.from> };
    const { data: profile } = await adminAny
      .from("profiles")
      .select("resume_url")
      .eq("id", userId)
      .single();

    if (!profile?.resume_url) {
      return NextResponse.json({ error: "No resume to delete" }, { status: 404 });
    }

    const storagePath = toStoragePath(profile.resume_url);

    await admin.storage.from(RESUME_BUCKET).remove([storagePath]);

    await adminAny
      .from("profiles")
      .update({ resume_url: null, resume_uploaded_at: null })
      .eq("id", userId);

    await admin.from("audit_logs").insert({
      entity_type: "resume_delete",
      entity_id: userId,
      changed_by: userId,
      new_value: { path: storagePath },
      change_reason: "resume_deleted",
    });

    return NextResponse.json({
      success: true,
      message: "Resume removed. Verified employment records were not changed.",
    });
  } catch {
    return NextResponse.json({ error: "Could not delete resume." }, { status: 500 });
  }
}
