import { NextResponse } from "next/server";

export const runtime = "nodejs";
import { getActingUser } from "@/lib/auth/actingUser";

/** GET /api/admin/impersonate/status — returns { impersonating: true } when acting_user cookie is set. */
export async function GET() {
  try {
    const acting = await getActingUser();
    return NextResponse.json({ impersonating: Boolean(acting) });
  } catch {
    return NextResponse.json({ impersonating: false });
  }
}
