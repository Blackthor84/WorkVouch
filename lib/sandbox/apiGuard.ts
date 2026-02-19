/**
 * Hard guard for sandbox APIs: 403 unless isSandboxEnv.
 * Use in every /api/sandbox/* route. Every write must include is_sandbox = true.
 */

import { NextResponse } from "next/server";
import { isSandboxEnv } from "@/lib/sandbox/env";

export function requireSandboxMode(): NextResponse | null {
  if (!isSandboxEnv) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}
