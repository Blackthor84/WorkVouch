/**
 * GET /api/user/profile-visibility — Get current profile visibility to employers.
 * PATCH /api/user/profile-visibility — Set employer_visibility (visible_to_employers | verified_only | archived).
 */

import { NextRequest, NextResponse } from "next/server";
import { admin } from "@/lib/supabase-admin";
import { getEffectiveUser } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { rejectWriteIfImpersonating } from "@/lib/server/rejectWriteIfImpersonating";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VISIBILITY_MAP = {
  visible_to_employers: "full",
  verified_only: "verified_only",
  archived: "private",
} as const;

const dbToApi = (db: string | null): keyof typeof VISIBILITY_MAP => {
  if (db === "full" || db === "listed_only") return "visible_to_employers";
  if (db === "verified_only") return "verified_only";
  return "archived";
};

const patchSchema = z.object({
  visibility: z.enum(["visible_to_employers", "verified_only", "archived"]),
});

export async function GET() {
  const effective = await getEffectiveUser();
  if (!effective?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await admin.from("profiles")
    .select("employer_visibility")
    .eq("id", effective.id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const raw = (data as { employer_visibility?: string | null }).employer_visibility ?? "listed_only";
  return NextResponse.json({ visibility: dbToApi(raw) });
}

export async function PATCH(req: NextRequest) {
  const reject = await rejectWriteIfImpersonating();
  if (reject) return reject;

  const effective = await getEffectiveUser();
  if (!effective?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid visibility", details: parsed.error.flatten() }, { status: 400 });
  }

  const dbValue = VISIBILITY_MAP[parsed.data.visibility];
  const supabase = await createServerSupabaseClient();
  const { error } = await admin.from("profiles")
    .update({ employer_visibility: dbValue })
    .eq("id", effective.id);

  if (error) {
    console.error("[profile-visibility] update error:", error);
    return NextResponse.json({ error: "Failed to update visibility" }, { status: 500 });
  }

  return NextResponse.json({ visibility: parsed.data.visibility });
}
