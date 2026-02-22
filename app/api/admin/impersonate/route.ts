import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { requireSuperAdminForApi } from "@/lib/admin/requireAdmin";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { createSandboxProfile } from "@/lib/sandbox/createSandboxProfile";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/admin/impersonate — profile-based. Accepts any string userId.
 * Look up via profiles only; never auth.users. Sandbox IDs get an auto-created profile.
 */
export async function POST(req: Request) {
  try {
    const admin = await requireSuperAdminForApi();
    if (!admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let body: { userId?: unknown };
    try {
      body = await req.json();
    } catch (e) {
      console.error("[impersonate] FAILED TO PARSE req.body:", e);
      return NextResponse.json(
        { error: "Invalid JSON body. Send { userId: string }." },
        { status: 400 }
      );
    }

    const rawUserId = body?.userId;
    if (rawUserId === undefined || rawUserId === null) {
      return NextResponse.json(
        { error: "Missing userId. Request body must include { userId: string }." },
        { status: 400 }
      );
    }
    if (typeof rawUserId !== "string") {
      return NextResponse.json(
        { error: "Invalid userId: must be a string." },
        { status: 400 }
      );
    }
    const userId = rawUserId.trim();
    if (!userId) {
      return NextResponse.json(
        { error: "userId cannot be empty." },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServer();
    const isSandbox = userId.startsWith("sandbox_");

    // Look up exclusively via profiles.user_id (profile-based). Never use auth.users.
    let profile: { id: string; user_id?: string } | null = null;
    const { data: profileRow, error: lookupError } = await supabase
      .from("profiles")
      .select("id, user_id")
      .eq("user_id", userId as string)
      .maybeSingle();

    if (!lookupError && profileRow) {
      profile = {
        id: profileRow.id,
        user_id: (profileRow as { user_id?: string }).user_id ?? profileRow.id,
      };
    }

    if (!profile && isSandbox) {
      const profileId = await createSandboxProfile(supabase, {
        full_name: "Sandbox User",
        role: "user",
        sandbox_id: "playground",
      });
      profile = { id: profileId, user_id: profileId };
    }

    if (!profile) {
      return NextResponse.json(
        { error: "Profile not found." },
        { status: 404 }
      );
    }

    const effectiveUserId = profile.user_id ?? profile.id;
    const cookieStore = await cookies();
    cookieStore.set("impersonatedUserId", effectiveUserId, { httpOnly: true, path: "/" });
    cookieStore.set("adminUserId", admin.authUserId, { httpOnly: true, path: "/" });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: unknown) {
    console.error("[impersonate] ERROR:", err);
    const message = err instanceof Error ? err.message : "Impersonation failed";
    return NextResponse.json(
      { error: message },
      { status: 400 }
    );
  }
}
