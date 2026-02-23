import { NextResponse } from "next/server";
import { getEffectiveUser } from "@/lib/auth/getEffectiveUser";
import { getSupabaseSession } from "@/lib/supabase/server";
import { applyScenario } from "@/lib/impersonation/scenarioResolver";

export async function GET() {
  const user = await getEffectiveUser();

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const baseData = { user: { ...user, __impersonated: user.isImpersonating } };
  const { session } = await getSupabaseSession();
  const finalData = applyScenario(baseData, session?.impersonation);
  return NextResponse.json(finalData);
}
