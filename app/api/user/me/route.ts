import { NextResponse } from "next/server";
import { getEffectiveUser } from "@/lib/auth/getEffectiveUser";

export async function GET() {
  const user = await getEffectiveUser();

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  return NextResponse.json({
    user: { ...user, __impersonated: user.isImpersonating },
  });
}
