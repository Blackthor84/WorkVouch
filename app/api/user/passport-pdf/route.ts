/**
 * GET /api/user/passport-pdf?id=<userId>
 * Placeholder: generate or redirect to Career Passport PDF. Not yet implemented.
 */
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = req.nextUrl.searchParams.get("id");
  if (id !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return NextResponse.json(
    { error: "PDF export not yet available. Use the shareable link to share your Career Passport." },
    { status: 501 }
  );
}
