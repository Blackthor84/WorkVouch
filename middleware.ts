import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { proxy } from "./proxy";

/**
 * Root middleware: sandbox bypass for /employer when ?sandbox=true,
 * then delegate to existing proxy for auth and protected routes.
 * Do NOT change production auth behavior; only allow /employer when sandbox=true.
 */
export async function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const sandbox = url.searchParams.get("sandbox") === "true";
  const sandboxId = url.searchParams.get("sandboxId")?.trim() ?? "";

  if (sandbox && sandboxId && url.pathname.startsWith("/employer")) {
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-sandbox-mode", "true");
    requestHeaders.set("x-sandbox-id", sandboxId);
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  return proxy(req);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    "/admin",
    "/admin/:path*",
  ],
};
