import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { requireSuperAdminForApi } from "@/lib/admin/requireAdmin";
import { startImpersonation } from "@/lib/admin/impersonation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
        { error: "Invalid JSON body. Send { userId: string } as JSON." },
        { status: 400 }
      );
    }

    console.log("[impersonate] req.body:", JSON.stringify(body));

    const rawUserId = body?.userId;
    if (rawUserId === undefined || rawUserId === null) {
      return NextResponse.json(
        { error: "Missing userId. Request body must include { userId: string }." },
        { status: 400 }
      );
    }
    if (typeof rawUserId !== "string") {
      return NextResponse.json(
        { error: "Invalid userId: must be a string (profile user_id)." },
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

    await startImpersonation({
      authUserId: admin.authUserId,
      actingUserId: userId,
    });

    const cookieStore = await cookies();
    cookieStore.set("impersonatedUserId", userId, { httpOnly: true, path: "/" });
    cookieStore.set("adminUserId", admin.authUserId, { httpOnly: true, path: "/" });

    console.log("[impersonate] SUCCESS:", userId);
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
