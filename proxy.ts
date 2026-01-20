// proxy.ts — required for Next.js 14+ (replaces middleware.ts)

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export default function proxy(request: NextRequest) {
  // Example: Let all requests through unchanged
  return NextResponse.next();
}
