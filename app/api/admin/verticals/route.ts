/**
 * Returns vertical names enabled for UI (platform_verticals.enabled or ENABLE_VERTICAL_X).
 * Use this to drive vertical dropdowns; hide education/construction unless enabled.
 */

import { NextResponse } from "next/server";

export const runtime = "nodejs";
import { getEnabledVerticalNames } from "@/lib/platform-verticals";

export async function GET() {
  try {
    const enabledNames = await getEnabledVerticalNames();
    return NextResponse.json({ enabledNames });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to load verticals";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
