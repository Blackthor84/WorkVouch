import { NextResponse } from "next/server";

export const runtime = "nodejs";

/** Legacy unauthenticated route — disabled in favor of POST /api/resume/upload */
export async function POST() {
  return NextResponse.json(
    {
      error: "This endpoint is deprecated. Use POST /api/resume/upload with field \"resume\".",
    },
    { status: 410 }
  );
}
