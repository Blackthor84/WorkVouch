import { NextResponse } from "next/server";
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
      console.error("FAILED TO PARSE JSON BODY");
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    console.log("IMPERSONATE API BODY:", body);

    const userId = body?.userId;

    if (!userId || typeof userId !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid userId" },
        { status: 400 }
      );
    }

    await startImpersonation({
      authUserId: admin.authUserId,
      actingUserId: userId.trim(),
    });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error("IMPERSONATE API ERROR:", err);
    const message = err instanceof Error ? err.message : "Impersonation failed";
    return NextResponse.json(
      { error: message },
      { status: 400 }
    );
  }
}
