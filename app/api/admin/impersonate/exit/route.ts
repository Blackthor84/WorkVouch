import { NextResponse } from "next/server";

export const runtime = "nodejs";
import { cookies } from "next/headers";

const IMPERSONATION_COOKIE = "workvouch_impersonation";

export async function GET(request: Request) {
  const cookieStore = await cookies();
  cookieStore.set(IMPERSONATION_COOKIE, "", { maxAge: 0, path: "/" });
  const url = new URL(request.url);
  return NextResponse.redirect(new URL("/admin", url.origin));
}

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.set(IMPERSONATION_COOKIE, "", { maxAge: 0, path: "/" });
  return NextResponse.json({ ok: true });
}
