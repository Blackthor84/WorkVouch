import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * GET /api/ping — verification endpoint. Returns { pong: true }.
 */
export async function GET() {
  return NextResponse.json({ pong: true });
}
