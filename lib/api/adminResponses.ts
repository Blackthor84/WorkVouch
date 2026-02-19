import { NextResponse } from "next/server";

export function adminForbiddenResponse() {
  return NextResponse.json(
    { error: "Admin access required" },
    { status: 403 }
  );
}
