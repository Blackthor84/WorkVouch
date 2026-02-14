import { NextResponse } from "next/server";

export const runtime = "nodejs";
import { cookies } from "next/headers";

const IMPERSONATION_COOKIE = "workvouch_impersonation";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.set(IMPERSONATION_COOKIE, "", { maxAge: 0, path: "/" });
  return NextResponse.json({ ok: true });
}
