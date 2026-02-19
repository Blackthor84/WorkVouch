import { NextResponse } from "next/server";
import { isSandboxEnv } from "@/lib/sandbox/env";

/**
 * Use at the start of /api/admin/* handlers (or rely on middleware).
 * In SANDBOX: never throw, never assume tables exist, never return 500.
 */
export function adminSandboxFailSoft(): NextResponse | null {
  if (isSandboxEnv) {
    return NextResponse.json(
      { data: [], notice: "Not available in sandbox" },
      { status: 200 }
    );
  }
  return null;
}
