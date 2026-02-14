/**
 * GET /api/directory — NOT open. Requires authenticated employer.
 * Public directory search uses server action only (no API). This route returns 401 when unauthenticated.
 */
import { NextResponse } from "next/server";

export const runtime = "nodejs";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized. Use the directory page to search." }, { status: 401 });
  }
  return NextResponse.json(
    { error: "Use the employer directory or server-side search. This API is not open for scraping." },
    { status: 403 }
  );
}
