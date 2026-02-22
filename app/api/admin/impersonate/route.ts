import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { requireSuperAdminForApi } from "@/lib/admin/requireAdmin";
import { getSupabaseServer } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(req: Request) {
  try {
    const admin = await requireSuperAdminForApi();
    if (!admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let body: { userId?: unknown };
    try {
      body = await req.json();
      console.log("[impersonate] raw body:", body);
    } catch (e) {
      console.error("[impersonate] FAILED TO PARSE req.body:", e);
      return NextResponse.json(
        { error: "Invalid JSON body. Send { userId: string } (UUID)." },
        { status: 400 }
      );
    }

    const rawUserId = body?.userId;
    if (rawUserId === undefined || rawUserId === null) {
      return NextResponse.json(
        { error: "Missing userId. Request body must include { userId: string } (UUID)." },
        { status: 400 }
      );
    }
    if (typeof rawUserId !== "string") {
      return NextResponse.json(
        { error: "Invalid userId: must be a string (real user UUID)." },
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

    if (!UUID_REGEX.test(userId)) {
      return NextResponse.json(
        { error: "Impersonation requires a valid user UUID. Sandbox string IDs are not supported." },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServer();
    const { data: authData, error: authError } = await supabase.auth.admin.getUserById(userId);
    if (authError || !authData?.user) {
      return NextResponse.json(
        { error: "User not found. Only real auth users (UUID) can be impersonated." },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    cookieStore.set("impersonatedUserId", userId, { httpOnly: true, path: "/" });
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
