/**
 * Hard guard for sandbox APIs: 403 unless ENV === SANDBOX.
 * Use in every /api/sandbox/* route.
 */

import { isSandbox } from "@/lib/app-mode";
import { NextResponse } from "next/server";

export function requireSandboxMode(): NextResponse | null {
  if (!isSandbox()) {
    return NextResponse.json({ error: "Sandbox mode required" }, { status: 403 });
  }
  return null;
}
